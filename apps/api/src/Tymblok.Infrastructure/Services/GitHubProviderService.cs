using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Octokit;
using Tymblok.Core.Entities;
using Tymblok.Core.Exceptions;
using Tymblok.Core.Interfaces;
using InboxItem = Tymblok.Core.Entities.InboxItem;

namespace Tymblok.Infrastructure.Services;

public class GitHubProviderService : IIntegrationProviderService
{
    private readonly GitHubSettings _settings;
    private readonly IOAuthStateService _stateService;
    private readonly ITokenEncryptionService _encryption;
    private readonly IInboxRepository _inboxRepository;
    private readonly ILogger<GitHubProviderService> _logger;

    private const int MaxItemsPerSync = 200;
    private const int RateLimitThreshold = 10;
    private const int PageSize = 50;

    public IntegrationProvider Provider => IntegrationProvider.GitHub;

    public GitHubProviderService(
        IOptions<GitHubSettings> settings,
        IOAuthStateService stateService,
        ITokenEncryptionService encryption,
        IInboxRepository inboxRepository,
        ILogger<GitHubProviderService> logger)
    {
        _settings = settings.Value;
        _stateService = stateService;
        _encryption = encryption;
        _inboxRepository = inboxRepository;
        _logger = logger;
    }

    public Task<OAuthConfig> GetAuthUrlAsync(Guid userId, string? redirectUri, string? mobileRedirectUri = null, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(_settings.ClientId))
        {
            throw new IntegrationException("GITHUB_NOT_CONFIGURED", "GitHub integration is not configured");
        }

        var state = _stateService.GenerateState(userId, IntegrationProvider.GitHub, mobileRedirectUri);

        var authUrl = $"https://github.com/login/oauth/authorize" +
            $"?client_id={Uri.EscapeDataString(_settings.ClientId)}" +
            $"&scope={Uri.EscapeDataString(_settings.IntegrationScopes)}" +
            $"&state={Uri.EscapeDataString(state)}";

        if (!string.IsNullOrEmpty(redirectUri))
        {
            authUrl += $"&redirect_uri={Uri.EscapeDataString(redirectUri)}";
        }

        return Task.FromResult(new OAuthConfig(authUrl, state));
    }

    public async Task<OAuthTokenResult> ExchangeCodeAsync(string code, string? redirectUri, CancellationToken ct = default)
    {
        var client = new GitHubClient(new ProductHeaderValue("Tymblok"));

        var tokenRequest = new OauthTokenRequest(_settings.ClientId, _settings.ClientSecret, code);
        var oauthToken = await client.Oauth.CreateAccessToken(tokenRequest);

        if (string.IsNullOrEmpty(oauthToken.AccessToken))
        {
            throw new IntegrationException("GITHUB_TOKEN_EXCHANGE_FAILED", "Failed to exchange GitHub authorization code for access token");
        }

        // Get user profile
        client.Credentials = new Credentials(oauthToken.AccessToken);
        var user = await client.User.Current();

        return new OAuthTokenResult(
            AccessToken: oauthToken.AccessToken,
            RefreshToken: null, // GitHub OAuth tokens don't expire
            ExpiresAt: null,
            ExternalUserId: user.Id.ToString(),
            ExternalUsername: user.Login,
            ExternalAvatarUrl: user.AvatarUrl
        );
    }

    public async Task<SyncResult> SyncAsync(Integration integration, Guid userId, CancellationToken ct = default)
    {
        var accessToken = _encryption.Decrypt(integration.AccessToken);
        var client = new GitHubClient(new ProductHeaderValue("Tymblok"))
        {
            Credentials = new Credentials(accessToken)
        };

        var itemsSynced = 0;
        var totalProcessed = 0;
        var page = 1;

        while (totalProcessed < MaxItemsPerSync)
        {
            if (ct.IsCancellationRequested) break;

            // Check rate limit before each page
            var rateLimit = await client.RateLimit.GetRateLimits();
            if (rateLimit.Resources.Core.Remaining < RateLimitThreshold)
            {
                _logger.LogWarning(
                    "GitHub rate limit low ({Remaining} remaining), stopping sync | UserId: {UserId}",
                    rateLimit.Resources.Core.Remaining, userId);
                break;
            }

            // Fetch notifications: all participating (read + unread) since last sync
            var notificationRequest = new NotificationsRequest
            {
                All = true,
                Participating = true
            };

            // Filter by date: use last sync time, or default to 7 days on first sync
            if (integration.LastSyncAt.HasValue)
            {
                notificationRequest.Since = integration.LastSyncAt.Value;
            }
            else
            {
                notificationRequest.Since = DateTime.UtcNow.AddDays(-7);
            }

            var notifications = await client.Activity.Notifications.GetAllForCurrent(
                notificationRequest,
                new ApiOptions
                {
                    PageSize = PageSize,
                    PageCount = 1,
                    StartPage = page
                });

            if (notifications.Count == 0) break;

            foreach (var notification in notifications)
            {
                if (ct.IsCancellationRequested) break;
                if (totalProcessed >= MaxItemsPerSync) break;
                totalProcessed++;

                // Filter: only PullRequest subjects with review_requested reason
                if (notification.Subject.Type != "PullRequest" ||
                    notification.Reason != "review_requested")
                {
                    continue;
                }

                // Parse owner/repo/number from the subject URL
                // Format: https://api.github.com/repos/{owner}/{repo}/pulls/{number}
                var subjectUrl = notification.Subject.Url;
                if (string.IsNullOrEmpty(subjectUrl)) continue;

                var parsed = ParsePullRequestUrl(subjectUrl);
                if (parsed == null) continue;
                var (owner, repo, prNumber) = parsed.Value;

                var externalId = $"github:{owner}/{repo}#{prNumber}";
                var existing = await _inboxRepository.GetByExternalIdAsync(userId, externalId);
                if (existing != null) continue;

                // Build data from notification — avoids needing the broad `repo` scope
                var htmlUrl = $"https://github.com/{owner}/{repo}/pull/{prNumber}";

                var inboxItem = new InboxItem
                {
                    UserId = userId,
                    IntegrationId = integration.Id,
                    Title = $"PR: {notification.Subject.Title}",
                    Description = $"Review requested · {owner}/{repo} #{prNumber}",
                    Source = InboxSource.GitHub,
                    Type = InboxItemType.Task,
                    Priority = InboxPriority.High, // Review requests are high priority
                    ExternalId = externalId,
                    ExternalUrl = htmlUrl
                };

                await _inboxRepository.CreateAsync(inboxItem);
                itemsSynced++;
            }

            // If we got fewer than PageSize, no more pages
            if (notifications.Count < PageSize) break;
            page++;
        }

        // Cleanup: fetch ALL active notifications (no date filter) to find dismissed PRs
        await CleanupStaleItemsAsync(client, integration, userId, ct);

        if (itemsSynced > 0)
        {
            await _inboxRepository.SaveChangesAsync(ct);
        }

        _logger.LogInformation(
            "GitHub sync completed | UserId: {UserId} | Items synced: {ItemsSynced} | Notifications processed: {Processed}",
            userId, itemsSynced, totalProcessed);
        return new SyncResult(itemsSynced, DateTime.UtcNow);
    }

    public Task RevokeAccessAsync(Integration integration, CancellationToken ct = default)
    {
        _logger.LogInformation("GitHub token revocation requested for integration {IntegrationId}", integration.Id);
        return Task.CompletedTask;
    }

    public Task<OAuthTokenResult?> RefreshTokenAsync(Integration integration, CancellationToken ct = default)
    {
        // GitHub OAuth tokens do not expire
        return Task.FromResult<OAuthTokenResult?>(null);
    }

    private async Task CleanupStaleItemsAsync(
        GitHubClient client, Integration integration, Guid userId, CancellationToken ct)
    {
        // Fetch ALL active participating notifications (no date filter) to build a complete picture
        // of what's still active on GitHub. Items not in this list have been resolved.
        try
        {
            var existingItems = await _inboxRepository.GetByIntegrationIdAsync(integration.Id);
            var githubItems = existingItems
                .Where(i => i.Source == InboxSource.GitHub && !i.IsDismissed && i.ExternalId != null)
                .ToList();

            if (githubItems.Count == 0) return; // Nothing to clean up

            // Fetch all active notifications (no Since filter) to see what's still alive
            var activeExternalIds = new HashSet<string>();
            var cleanupPage = 1;

            while (true)
            {
                if (ct.IsCancellationRequested) break;

                var notifications = await client.Activity.Notifications.GetAllForCurrent(
                    new NotificationsRequest { All = true, Participating = true },
                    new ApiOptions { PageSize = PageSize, PageCount = 1, StartPage = cleanupPage });

                if (notifications.Count == 0) break;

                foreach (var notification in notifications)
                {
                    if (notification.Subject.Type != "PullRequest") continue;
                    var parsed = ParsePullRequestUrl(notification.Subject.Url);
                    if (parsed == null) continue;
                    var (owner, repo, prNumber) = parsed.Value;
                    activeExternalIds.Add($"github:{owner}/{repo}#{prNumber}");
                }

                if (notifications.Count < PageSize) break;
                cleanupPage++;
            }

            // Dismiss items no longer in the active notification list
            var dismissed = 0;
            foreach (var item in githubItems)
            {
                if (ct.IsCancellationRequested) break;

                if (!activeExternalIds.Contains(item.ExternalId!))
                {
                    item.IsDismissed = true;
                    item.DismissedAt = DateTime.UtcNow;
                    dismissed++;
                }
            }

            if (dismissed > 0)
            {
                _logger.LogInformation(
                    "GitHub cleanup: auto-dismissed {Count} stale items | UserId: {UserId}",
                    dismissed, userId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "GitHub cleanup phase failed for UserId: {UserId}", userId);
        }
    }

    private static (string Owner, string Repo, int Number)? ParsePullRequestUrl(string url)
    {
        // Format: https://api.github.com/repos/{owner}/{repo}/pulls/{number}
        try
        {
            var uri = new Uri(url);
            var segments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
            // segments: ["repos", owner, repo, "pulls", number]
            if (segments.Length >= 5 && segments[0] == "repos" && (segments[3] == "pulls" || segments[3] == "issues"))
            {
                return (segments[1], segments[2], int.Parse(segments[4]));
            }
        }
        catch { }
        return null;
    }
}
