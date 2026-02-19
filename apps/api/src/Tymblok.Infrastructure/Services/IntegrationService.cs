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
        return integrations.Select(i => new IntegrationData(
            i.Id,
            i.Provider,
            i.ExternalUsername,
            i.ExternalAvatarUrl,
            i.LastSyncAt,
            i.LastSyncError,
            i.CreatedAt
        )).ToList();
    }

    public async Task<OAuthConfig> ConnectAsync(Guid userId, IntegrationProvider provider, string? apiCallbackUrl, string? mobileRedirectUri = null, CancellationToken ct = default)
    {
        // Check if already connected
        var existing = await _repository.GetByProviderAsync(userId, provider);
        if (existing != null)
        {
            throw new ConflictException("INTEGRATION_ALREADY_CONNECTED",
                $"{provider} is already connected. Disconnect first to reconnect.");
        }

        // Store the mobile redirect URI in the OAuth state so the callback can redirect back
        var providerService = GetProviderService(provider);
        return await providerService.GetAuthUrlAsync(userId, apiCallbackUrl, mobileRedirectUri, ct);
    }

    public async Task<IntegrationData> CallbackAsync(
        Guid userId,
        IntegrationProvider provider,
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
        }

        // Check if already connected (race condition guard)
        var existing = await _repository.GetByProviderAsync(userId, provider);
        if (existing != null)
        {
            throw new ConflictException("INTEGRATION_ALREADY_CONNECTED",
                $"{provider} is already connected.");
        }

        // Exchange code for tokens
        var providerService = GetProviderService(provider);
        var tokenResult = await providerService.ExchangeCodeAsync(code, redirectUri, ct);

        // Create integration with encrypted tokens
        var integration = new Integration
        {
            UserId = userId,
            Provider = provider,
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
            newValues: new { integration.Provider, integration.ExternalUsername });

        _logger.LogInformation("Integration connected | Provider: {Provider} | UserId: {UserId} | ExternalUser: {ExternalUser}",
            provider, userId, tokenResult.ExternalUsername);

        // Trigger initial sync (best-effort)
        try
        {
            var syncResult = await SyncAsync(userId, provider, ct);
            _logger.LogInformation("Initial sync after connect | Provider: {Provider} | UserId: {UserId} | Items: {ItemsSynced}",
                provider, userId, syncResult.ItemsSynced);
            // Refresh integration data to include LastSyncAt
            integration = (await _repository.GetByProviderAsync(userId, provider))!;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Initial sync after connect failed (non-critical) | Provider: {Provider} | UserId: {UserId}",
                provider, userId);
        }

        return new IntegrationData(
            integration.Id,
            integration.Provider,
            integration.ExternalUsername,
            integration.ExternalAvatarUrl,
            integration.LastSyncAt,
            integration.LastSyncError,
            integration.CreatedAt
        );
    }

    public async Task DisconnectAsync(Guid userId, IntegrationProvider provider, CancellationToken ct = default)
    {
        var integration = await _repository.GetByProviderAsync(userId, provider);
        if (integration == null)
        {
            throw new NotFoundException("INTEGRATION_NOT_FOUND", $"{provider} integration not found");
        }

        // Revoke access at the provider (best-effort)
        try
        {
            var providerService = GetProviderService(provider);
            await providerService.RevokeAccessAsync(integration, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to revoke {Provider} access for user {UserId}. Continuing with disconnect.",
                provider, userId);
        }

        // Delete the integration (InboxItems.IntegrationId will be set to null via FK cascade)
        _repository.Delete(integration);
        await _repository.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "IntegrationDisconnect",
            entityType: "Integration",
            entityId: integration.Id.ToString(),
            userId: userId,
            oldValues: new { integration.Provider, integration.ExternalUsername });

        _logger.LogInformation("Integration disconnected | Provider: {Provider} | UserId: {UserId}",
            provider, userId);
    }

    public async Task<SyncResult> SyncAsync(Guid userId, IntegrationProvider provider, CancellationToken ct = default)
    {
        var integration = await _repository.GetByProviderAsync(userId, provider);
        if (integration == null)
        {
            throw new NotFoundException("INTEGRATION_NOT_FOUND", $"{provider} integration not found");
        }

        var providerService = GetProviderService(provider);

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
            var result = await providerService.SyncAsync(integration, userId, ct);

            integration.LastSyncAt = result.SyncedAt;
            integration.LastSyncError = null;
            _repository.Update(integration);
            await _repository.SaveChangesAsync(ct);

            await _auditService.LogAsync(
                action: "IntegrationSync",
                entityType: "Integration",
                entityId: integration.Id.ToString(),
                userId: userId,
                newValues: new { result.ItemsSynced, result.SyncedAt });

            _logger.LogInformation("Integration synced | Provider: {Provider} | UserId: {UserId} | Items: {ItemsSynced}",
                provider, userId, result.ItemsSynced);

            return result;
        }
        catch (Exception ex)
        {
            integration.LastSyncError = ex.Message;
            _repository.Update(integration);
            await _repository.SaveChangesAsync(ct);

            _logger.LogError(ex, "Integration sync failed | Provider: {Provider} | UserId: {UserId}",
                provider, userId);

            throw new IntegrationException("SYNC_FAILED", $"Failed to sync {provider}: {ex.Message}");
        }
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
                var result = await SyncAsync(userId, integration.Provider, ct);
                totalItems += result.ItemsSynced;
                syncedCount++;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "SyncAll: failed for provider {Provider} | UserId: {UserId}",
                    integration.Provider, userId);
            }
        }

        return new SyncAllResult(totalItems, syncedCount, DateTime.UtcNow);
    }

    public OAuthStateData? ValidateOAuthState(string state)
    {
        return _stateService.ValidateState(state);
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
}
