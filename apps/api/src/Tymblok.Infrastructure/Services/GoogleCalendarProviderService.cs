using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using Google.Apis.Auth.OAuth2;
using Tymblok.Core.Entities;
using Tymblok.Core.Exceptions;
using Tymblok.Core.Interfaces;
using TimeBlock = Tymblok.Core.Entities.TimeBlock;

namespace Tymblok.Infrastructure.Services;

public class GoogleCalendarProviderService : IIntegrationProviderService
{
    private readonly GoogleCalendarSettings _settings;
    private readonly IOAuthStateService _stateService;
    private readonly ITokenEncryptionService _encryption;
    private readonly IBlockRepository _blockRepository;
    private readonly IInboxRepository _inboxRepository;
    private readonly ILogger<GoogleCalendarProviderService> _logger;

    // Meeting system category ID
    private static readonly Guid MeetingCategoryId = Guid.Parse("00000000-0000-0000-0000-000000000003");

    public IntegrationProvider Provider => IntegrationProvider.GoogleCalendar;

    public GoogleCalendarProviderService(
        IOptions<GoogleCalendarSettings> settings,
        IOAuthStateService stateService,
        ITokenEncryptionService encryption,
        IBlockRepository blockRepository,
        IInboxRepository inboxRepository,
        ILogger<GoogleCalendarProviderService> logger)
    {
        _settings = settings.Value;
        _stateService = stateService;
        _encryption = encryption;
        _blockRepository = blockRepository;
        _inboxRepository = inboxRepository;
        _logger = logger;
    }

    public Task<OAuthConfig> GetAuthUrlAsync(Guid userId, string? redirectUri, string? mobileRedirectUri = null, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(_settings.ClientId))
        {
            throw new IntegrationException("GOOGLE_CALENDAR_NOT_CONFIGURED", "Google Calendar integration is not configured");
        }

        var state = _stateService.GenerateState(userId, IntegrationProvider.GoogleCalendar, mobileRedirectUri);

        var authUrl = "https://accounts.google.com/o/oauth2/v2/auth" +
            $"?client_id={Uri.EscapeDataString(_settings.ClientId)}" +
            $"&response_type=code" +
            $"&scope={Uri.EscapeDataString(_settings.IntegrationScopes)}" +
            $"&state={Uri.EscapeDataString(state)}" +
            $"&access_type=offline" +
            $"&prompt=consent";

        if (!string.IsNullOrEmpty(redirectUri))
        {
            authUrl += $"&redirect_uri={Uri.EscapeDataString(redirectUri)}";
        }

        return Task.FromResult(new OAuthConfig(authUrl, state));
    }

    public async Task<OAuthTokenResult> ExchangeCodeAsync(string code, string? redirectUri, CancellationToken ct = default)
    {
        using var httpClient = new HttpClient();

        var tokenRequest = new Dictionary<string, string>
        {
            ["client_id"] = _settings.ClientId,
            ["client_secret"] = _settings.ClientSecret,
            ["code"] = code,
            ["grant_type"] = "authorization_code"
        };

        if (!string.IsNullOrEmpty(redirectUri))
        {
            tokenRequest["redirect_uri"] = redirectUri;
        }

        var response = await httpClient.PostAsync(
            "https://oauth2.googleapis.com/token",
            new FormUrlEncodedContent(tokenRequest),
            ct);

        var content = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Google token exchange failed: {Response}", content);
            throw new IntegrationException("GOOGLE_TOKEN_EXCHANGE_FAILED",
                "Failed to exchange Google authorization code for access token");
        }

        var tokenData = JsonSerializer.Deserialize<JsonElement>(content);
        var accessToken = tokenData.GetProperty("access_token").GetString()!;
        var refreshToken = tokenData.TryGetProperty("refresh_token", out var rt) ? rt.GetString() : null;
        var expiresIn = tokenData.TryGetProperty("expires_in", out var ei) ? ei.GetInt32() : 3600;

        // Get user profile
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var userResponse = await httpClient.GetAsync("https://www.googleapis.com/oauth2/v2/userinfo", ct);
        var userContent = await userResponse.Content.ReadAsStringAsync(ct);

        if (!userResponse.IsSuccessStatusCode)
        {
            _logger.LogError("Google userinfo request failed: {Response}", userContent);
            throw new IntegrationException("GOOGLE_USERINFO_FAILED",
                "Failed to retrieve Google user profile");
        }

        var userData = JsonSerializer.Deserialize<JsonElement>(userContent);

        // Use 'id' if available, fall back to 'sub' (OpenID Connect) or email
        var externalUserId = userData.TryGetProperty("id", out var id) ? id.GetString()
            : userData.TryGetProperty("sub", out var sub) ? sub.GetString()
            : userData.TryGetProperty("email", out var emailId) ? emailId.GetString()
            : throw new IntegrationException("GOOGLE_USERINFO_MISSING_ID",
                "Google user profile did not contain an identifier");

        return new OAuthTokenResult(
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            ExpiresAt: DateTime.UtcNow.AddSeconds(expiresIn),
            ExternalUserId: externalUserId!,
            ExternalUsername: userData.TryGetProperty("email", out var email) ? email.GetString() : null,
            ExternalAvatarUrl: userData.TryGetProperty("picture", out var pic) ? pic.GetString() : null
        );
    }

    public async Task<SyncResult> SyncAsync(Integration integration, Guid userId, CancellationToken ct = default)
    {
        var accessToken = _encryption.Decrypt(integration.AccessToken);

        // Refresh token if needed
        if (integration.TokenExpiresAt.HasValue &&
            integration.TokenExpiresAt.Value < DateTime.UtcNow.AddMinutes(5) &&
            integration.RefreshToken != null)
        {
            var refreshed = await RefreshTokenAsync(integration, ct);
            if (refreshed != null)
            {
                accessToken = refreshed.AccessToken;
            }
        }

        var credential = GoogleCredential.FromAccessToken(accessToken);
        var calendarService = new CalendarService(new BaseClientService.Initializer
        {
            HttpClientInitializer = credential,
            ApplicationName = "Tymblok"
        });

        var now = DateTime.UtcNow;
        var todayStart = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);
        var request = calendarService.Events.List("primary");
        request.TimeMinDateTimeOffset = new DateTimeOffset(todayStart);
        request.TimeMaxDateTimeOffset = new DateTimeOffset(todayStart.AddDays(30));
        request.SingleEvents = true;
        request.OrderBy = EventsResource.ListRequest.OrderByEnum.StartTime;
        request.MaxResults = 250;

        var events = await request.ExecuteAsync(ct);
        var itemsSynced = 0;

        _logger.LogInformation("Google Calendar API returned {Count} events for range {Start} to {End}",
            events.Items?.Count ?? 0, todayStart, todayStart.AddDays(30));

        if (events.Items == null) return new SyncResult(0, DateTime.UtcNow);

        var fetchedAllDayExternalIds = new HashSet<string>();

        foreach (var evt in events.Items)
        {
            if (ct.IsCancellationRequested) break;

            var externalId = $"gcal:{evt.Id}";
            var isTimedEvent = evt.Start?.DateTimeDateTimeOffset != null && evt.End?.DateTimeDateTimeOffset != null;

            // Track all-day event IDs for stale-item cleanup
            if (!isTimedEvent) fetchedAllDayExternalIds.Add(externalId);

            if (string.IsNullOrEmpty(evt.Summary)) continue;

            if (isTimedEvent)
            {
                // Timed event → TimeBlock (create or update)
                var startDt = evt.Start!.DateTimeDateTimeOffset!.Value.UtcDateTime;
                var endDt = evt.End!.DateTimeDateTimeOffset!.Value.UtcDateTime;
                var duration = (int)(endDt - startDt).TotalMinutes;
                if (duration <= 0 || duration > 1440) continue;

                var existingBlock = await _blockRepository.GetByExternalIdAsync(userId, externalId);

                if (existingBlock != null)
                {
                    var changed = false;
                    if (existingBlock.Title != evt.Summary) { existingBlock.Title = evt.Summary; changed = true; }
                    if (existingBlock.Subtitle != evt.Location) { existingBlock.Subtitle = evt.Location; changed = true; }
                    if (existingBlock.Date != DateOnly.FromDateTime(startDt)) { existingBlock.Date = DateOnly.FromDateTime(startDt); changed = true; }
                    if (existingBlock.StartTime != TimeOnly.FromDateTime(startDt)) { existingBlock.StartTime = TimeOnly.FromDateTime(startDt); changed = true; }
                    if (existingBlock.EndTime != TimeOnly.FromDateTime(endDt)) { existingBlock.EndTime = TimeOnly.FromDateTime(endDt); changed = true; }
                    if (existingBlock.DurationMinutes != duration) { existingBlock.DurationMinutes = duration; changed = true; }
                    if (existingBlock.ExternalUrl != evt.HtmlLink) { existingBlock.ExternalUrl = evt.HtmlLink; changed = true; }

                    if (changed)
                    {
                        _blockRepository.Update(existingBlock);
                        itemsSynced++;
                    }
                }
                else
                {
                    await _blockRepository.CreateAsync(new TimeBlock
                    {
                        UserId = userId,
                        CategoryId = MeetingCategoryId,
                        Title = evt.Summary,
                        Subtitle = evt.Location,
                        Date = DateOnly.FromDateTime(startDt),
                        StartTime = TimeOnly.FromDateTime(startDt),
                        EndTime = TimeOnly.FromDateTime(endDt),
                        DurationMinutes = duration,
                        ExternalId = externalId,
                        ExternalUrl = evt.HtmlLink,
                        ExternalSource = IntegrationProvider.GoogleCalendar,
                        SortOrder = 0
                    });
                    itemsSynced++;
                }
            }
            else
            {
                // All-day event → Inbox (dedup only, no update needed)
                var existingInbox = await _inboxRepository.GetByExternalIdAsync(userId, externalId);
                if (existingInbox != null) continue;

                await _inboxRepository.CreateAsync(new InboxItem
                {
                    UserId = userId,
                    IntegrationId = integration.Id,
                    Title = evt.Summary,
                    Description = TruncateDescription(evt.Description),
                    Source = InboxSource.GoogleCalendar,
                    Type = InboxItemType.Event,
                    Priority = InboxPriority.Medium,
                    ExternalId = externalId,
                    ExternalUrl = evt.HtmlLink
                });
                itemsSynced++;
            }
        }

        // Cleanup stale inbox items (past events or events deleted from the calendar)
        var dismissedCount = await CleanupStaleInboxItemsAsync(
            integration, userId, fetchedAllDayExternalIds, ct);

        if (itemsSynced > 0 || dismissedCount > 0)
        {
            await _blockRepository.SaveChangesAsync(ct);
            await _inboxRepository.SaveChangesAsync(ct);
        }

        _logger.LogInformation(
            "Google Calendar sync completed | UserId: {UserId} | Items synced: {ItemsSynced} | Items auto-dismissed: {Dismissed}",
            userId, itemsSynced, dismissedCount);

        return new SyncResult(itemsSynced, DateTime.UtcNow);
    }

    public async Task RevokeAccessAsync(Integration integration, CancellationToken ct = default)
    {
        try
        {
            var accessToken = _encryption.Decrypt(integration.AccessToken);
            using var httpClient = new HttpClient();
            await httpClient.PostAsync(
                $"https://oauth2.googleapis.com/revoke?token={Uri.EscapeDataString(accessToken)}",
                null, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to revoke Google Calendar token for integration {IntegrationId}",
                integration.Id);
        }
    }

    public async Task<OAuthTokenResult?> RefreshTokenAsync(Integration integration, CancellationToken ct = default)
    {
        if (integration.RefreshToken == null) return null;

        var refreshToken = _encryption.Decrypt(integration.RefreshToken);

        using var httpClient = new HttpClient();
        var tokenRequest = new Dictionary<string, string>
        {
            ["client_id"] = _settings.ClientId,
            ["client_secret"] = _settings.ClientSecret,
            ["refresh_token"] = refreshToken,
            ["grant_type"] = "refresh_token"
        };

        var response = await httpClient.PostAsync(
            "https://oauth2.googleapis.com/token",
            new FormUrlEncodedContent(tokenRequest),
            ct);

        var content = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Google token refresh failed: {Response}", content);
            return null;
        }

        var tokenData = JsonSerializer.Deserialize<JsonElement>(content);
        var newAccessToken = tokenData.GetProperty("access_token").GetString()!;
        var expiresIn = tokenData.TryGetProperty("expires_in", out var ei) ? ei.GetInt32() : 3600;

        return new OAuthTokenResult(
            AccessToken: newAccessToken,
            RefreshToken: null, // Google doesn't return a new refresh token on refresh
            ExpiresAt: DateTime.UtcNow.AddSeconds(expiresIn),
            ExternalUserId: integration.ExternalUserId,
            ExternalUsername: integration.ExternalUsername,
            ExternalAvatarUrl: integration.ExternalAvatarUrl
        );
    }

    private async Task<int> CleanupStaleInboxItemsAsync(
        Integration integration, Guid userId, HashSet<string> fetchedExternalIds, CancellationToken ct)
    {
        try
        {
            var existingItems = await _inboxRepository.GetByIntegrationIdAsync(integration.Id, ct);
            var googleCalendarItems = existingItems
                .Where(i => i.Source == InboxSource.GoogleCalendar
                         && !i.IsDismissed
                         && i.ExternalId != null)
                .ToList();

            if (googleCalendarItems.Count == 0) return 0;

            var dismissed = 0;
            foreach (var item in googleCalendarItems)
            {
                if (ct.IsCancellationRequested) break;

                if (!fetchedExternalIds.Contains(item.ExternalId!))
                {
                    item.IsDismissed = true;
                    item.DismissedAt = DateTime.UtcNow;
                    dismissed++;
                }
            }

            if (dismissed > 0)
            {
                _logger.LogInformation(
                    "Google Calendar cleanup: auto-dismissed {Count} stale inbox items | UserId: {UserId}",
                    dismissed, userId);
            }

            return dismissed;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Google Calendar cleanup phase failed for UserId: {UserId}", userId);
            return 0;
        }
    }

    private static string? TruncateDescription(string? description)
    {
        if (string.IsNullOrEmpty(description)) return null;
        return description.Length > 2000 ? description[..2000] : description;
    }
}
