using Microsoft.Extensions.Logging;
using Tymblok.Core.Entities;
using Tymblok.Core.Exceptions;
using Tymblok.Core.Interfaces;

namespace Tymblok.Infrastructure.Services;

public class IntegrationService : IIntegrationService
{
    private readonly IIntegrationRepository _repository;
    private readonly IInboxRepository _inboxRepository;
    private readonly ITokenEncryptionService _encryption;
    private readonly IOAuthStateService _stateService;
    private readonly IAuditService _auditService;
    private readonly IEnumerable<IIntegrationProviderService> _providers;
    private readonly ILogger<IntegrationService> _logger;

    public IntegrationService(
        IIntegrationRepository repository,
        IInboxRepository inboxRepository,
        ITokenEncryptionService encryption,
        IOAuthStateService stateService,
        IAuditService auditService,
        IEnumerable<IIntegrationProviderService> providers,
        ILogger<IntegrationService> logger)
    {
        _repository = repository;
        _inboxRepository = inboxRepository;
        _encryption = encryption;
        _stateService = stateService;
        _auditService = auditService;
        _providers = providers;
        _logger = logger;
    }

    public async Task<IList<IntegrationData>> GetAllAsync(Guid userId, CancellationToken ct = default)
    {
        var integrations = await _repository.GetByUserIdAsync(userId);
        return integrations.Select(ToData).ToList();
    }

    public async Task<OAuthConfig> ConnectAsync(Guid userId, IntegrationProvider provider, string? name, string? apiCallbackUrl, string? mobileRedirectUri = null, CancellationToken ct = default)
    {
        // Store the mobile redirect URI and name in the OAuth state so the callback can use them
        var providerService = GetProviderService(provider);
        return await providerService.GetAuthUrlAsync(userId, apiCallbackUrl, mobileRedirectUri, name, ct);
    }

    public async Task<IntegrationData> CallbackAsync(
        Guid userId,
        IntegrationProvider provider,
        string? name,
        string code,
        string? state,
        string? redirectUri,
        CancellationToken ct = default)
    {
        // Validate OAuth state (skip if null — caller already validated, e.g. OAuthCallback endpoint)
        if (state != null)
        {
            var stateData = _stateService.ValidateState(state);
            if (stateData == null)
            {
                throw new ValidationException("INVALID_STATE", "OAuth state is invalid or expired");
            }

            if (stateData.UserId != userId || stateData.Provider != provider)
            {
                throw new ValidationException("STATE_MISMATCH", "OAuth state does not match the request");
            }

            // Use the name from state if not provided directly
            name ??= stateData.Name;
        }

        // Exchange code for tokens
        var providerService = GetProviderService(provider);
        var tokenResult = await providerService.ExchangeCodeAsync(code, redirectUri, ct);

        // Prevent duplicate: same provider + same external account
        var existing = await _repository.GetByExternalAccountAsync(userId, provider, tokenResult.ExternalUserId);
        if (existing != null)
        {
            throw new ConflictException("ACCOUNT_ALREADY_CONNECTED",
                $"This {GenerateProviderDisplayName(provider)} account ({tokenResult.ExternalUsername ?? tokenResult.ExternalUserId}) is already connected.");
        }

        // Default name: provider display name + external username (e.g. "GitHub - octocat")
        var displayName = name ?? GenerateDefaultName(provider, tokenResult.ExternalUsername);

        // Create integration with encrypted tokens
        var integration = new Integration
        {
            UserId = userId,
            Provider = provider,
            Name = displayName,
            AccessToken = _encryption.Encrypt(tokenResult.AccessToken),
            RefreshToken = tokenResult.RefreshToken != null ? _encryption.Encrypt(tokenResult.RefreshToken) : null,
            TokenExpiresAt = tokenResult.ExpiresAt,
            ExternalUserId = tokenResult.ExternalUserId,
            ExternalUsername = tokenResult.ExternalUsername,
            ExternalAvatarUrl = tokenResult.ExternalAvatarUrl
        };

        await _repository.CreateAsync(integration);
        await _repository.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "IntegrationConnect",
            entityType: "Integration",
            entityId: integration.Id.ToString(),
            userId: userId,
            newValues: new { integration.Provider, integration.Name, integration.ExternalUsername });

        _logger.LogInformation("Integration connected | Provider: {Provider} | Name: {Name} | UserId: {UserId} | ExternalUser: {ExternalUser}",
            provider, displayName, userId, tokenResult.ExternalUsername);

        // Trigger initial sync (best-effort)
        try
        {
            var syncResult = await SyncIntegrationAsync(integration, ct);
            _logger.LogInformation("Initial sync after connect | Provider: {Provider} | UserId: {UserId} | Items: {ItemsSynced}",
                provider, userId, syncResult.ItemsSynced);
            // Refresh integration data to include LastSyncAt
            integration = (await _repository.GetByIdAndUserAsync(integration.Id, userId))!;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Initial sync after connect failed (non-critical) | Provider: {Provider} | UserId: {UserId}",
                provider, userId);
        }

        return ToData(integration);
    }

    public async Task DisconnectAsync(Guid userId, Guid integrationId, CancellationToken ct = default)
    {
        var integration = await _repository.GetByIdAndUserAsync(integrationId, userId);
        if (integration == null)
        {
            throw new NotFoundException("INTEGRATION_NOT_FOUND", "Integration not found");
        }

        // Revoke access at the provider (best-effort)
        try
        {
            var providerService = GetProviderService(integration.Provider);
            await providerService.RevokeAccessAsync(integration, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to revoke {Provider} access for user {UserId}. Continuing with disconnect.",
                integration.Provider, userId);
        }

        // Delete the integration (InboxItems.IntegrationId will be set to null via FK cascade)
        _repository.Delete(integration);
        await _repository.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "IntegrationDisconnect",
            entityType: "Integration",
            entityId: integration.Id.ToString(),
            userId: userId,
            oldValues: new { integration.Provider, integration.Name, integration.ExternalUsername });

        _logger.LogInformation("Integration disconnected | Provider: {Provider} | Name: {Name} | UserId: {UserId}",
            integration.Provider, integration.Name, userId);
    }

    public async Task<IntegrationData> RenameAsync(Guid userId, Guid integrationId, string name, CancellationToken ct = default)
    {
        var integration = await _repository.GetByIdAndUserAsync(integrationId, userId);
        if (integration == null)
        {
            throw new NotFoundException("INTEGRATION_NOT_FOUND", "Integration not found");
        }

        integration.Name = name;
        _repository.Update(integration);
        await _repository.SaveChangesAsync(ct);

        return ToData(integration);
    }

    public async Task<SyncResult> SyncAsync(Guid userId, Guid integrationId, CancellationToken ct = default)
    {
        var integration = await _repository.GetByIdAndUserAsync(integrationId, userId);
        if (integration == null)
        {
            throw new NotFoundException("INTEGRATION_NOT_FOUND", "Integration not found");
        }

        return await SyncIntegrationAsync(integration, ct);
    }

    public async Task<SyncAllResult> SyncAllAsync(Guid userId, int minIntervalSeconds = 300, CancellationToken ct = default)
    {
        var integrations = await _repository.GetByUserIdAsync(userId);
        var activeIntegrations = integrations
            .Where(i => !string.IsNullOrEmpty(i.AccessToken))
            .ToList();

        if (activeIntegrations.Count == 0)
        {
            return new SyncAllResult(0, 0, DateTime.UtcNow);
        }

        // Server-side debounce: skip integrations synced within minIntervalSeconds
        var cutoff = DateTime.UtcNow.AddSeconds(-minIntervalSeconds);
        var dueForSync = activeIntegrations
            .Where(i => !i.LastSyncAt.HasValue || i.LastSyncAt.Value < cutoff)
            .ToList();

        if (dueForSync.Count == 0)
        {
            _logger.LogDebug("SyncAll skipped - all integrations synced recently | UserId: {UserId}", userId);
            return new SyncAllResult(0, 0, DateTime.UtcNow);
        }

        var totalItems = 0;
        var syncedCount = 0;

        foreach (var integration in dueForSync)
        {
            if (ct.IsCancellationRequested) break;
            try
            {
                var result = await SyncIntegrationAsync(integration, ct);
                totalItems += result.ItemsSynced;
                syncedCount++;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "SyncAll: failed for provider {Provider} (id={IntegrationId}) | UserId: {UserId}",
                    integration.Provider, integration.Id, integration.UserId);
            }
        }

        return new SyncAllResult(totalItems, syncedCount, DateTime.UtcNow);
    }

    public OAuthStateData? ValidateOAuthState(string state)
    {
        return _stateService.ValidateState(state);
    }

    /// <summary>
    /// Internal sync that operates on a loaded Integration entity.
    /// Handles token refresh, provider sync, and error recording.
    /// </summary>
    private async Task<SyncResult> SyncIntegrationAsync(Integration integration, CancellationToken ct)
    {
        var providerService = GetProviderService(integration.Provider);

        // Refresh token if needed
        if (integration.TokenExpiresAt.HasValue &&
            integration.TokenExpiresAt.Value < DateTime.UtcNow.AddMinutes(5))
        {
            var refreshResult = await providerService.RefreshTokenAsync(integration, ct);
            if (refreshResult != null)
            {
                integration.AccessToken = _encryption.Encrypt(refreshResult.AccessToken);
                if (refreshResult.RefreshToken != null)
                {
                    integration.RefreshToken = _encryption.Encrypt(refreshResult.RefreshToken);
                }
                integration.TokenExpiresAt = refreshResult.ExpiresAt;
                _repository.Update(integration);
                await _repository.SaveChangesAsync(ct);
            }
        }

        try
        {
            var result = await providerService.SyncAsync(integration, integration.UserId, ct);

            integration.LastSyncAt = result.SyncedAt;
            integration.LastSyncError = null;
            _repository.Update(integration);
            await _repository.SaveChangesAsync(ct);

            await _auditService.LogAsync(
                action: "IntegrationSync",
                entityType: "Integration",
                entityId: integration.Id.ToString(),
                userId: integration.UserId,
                newValues: new { result.ItemsSynced, result.SyncedAt });

            _logger.LogInformation("Integration synced | Provider: {Provider} | Name: {Name} | UserId: {UserId} | Items: {ItemsSynced}",
                integration.Provider, integration.Name, integration.UserId, result.ItemsSynced);

            return result;
        }
        catch (Exception ex)
        {
            integration.LastSyncError = ex.Message;
            _repository.Update(integration);
            await _repository.SaveChangesAsync(ct);

            _logger.LogError(ex, "Integration sync failed | Provider: {Provider} | Name: {Name} | UserId: {UserId}",
                integration.Provider, integration.Name, integration.UserId);

            throw new IntegrationException("SYNC_FAILED", $"Failed to sync {integration.Provider}: {ex.Message}");
        }
    }

    private IIntegrationProviderService GetProviderService(IntegrationProvider provider)
    {
        var service = _providers.FirstOrDefault(p => p.Provider == provider);
        if (service == null)
        {
            throw new ValidationException("PROVIDER_NOT_SUPPORTED", $"Integration provider {provider} is not supported");
        }
        return service;
    }

    private static string GenerateProviderDisplayName(IntegrationProvider provider) => provider switch
    {
        IntegrationProvider.GitHub => "GitHub",
        IntegrationProvider.GoogleCalendar => "Google Calendar",
        IntegrationProvider.Jira => "Jira",
        IntegrationProvider.Slack => "Slack",
        IntegrationProvider.Notion => "Notion",
        IntegrationProvider.Linear => "Linear",
        _ => provider.ToString()
    };

    private static string GenerateDefaultName(IntegrationProvider provider, string? externalUsername)
    {
        var providerName = GenerateProviderDisplayName(provider);
        return string.IsNullOrEmpty(externalUsername)
            ? providerName
            : $"{providerName} - {externalUsername}";
    }

    private static IntegrationData ToData(Integration i) => new(
        i.Id,
        i.Provider,
        i.Name,
        i.ExternalUsername,
        i.ExternalAvatarUrl,
        i.LastSyncAt,
        i.LastSyncError,
        i.CreatedAt
    );
}
