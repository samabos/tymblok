using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

public record IntegrationData(
    Guid Id,
    IntegrationProvider Provider,
    string? ExternalUsername,
    string? ExternalAvatarUrl,
    DateTime? LastSyncAt,
    string? LastSyncError,
    DateTime CreatedAt
);

public record SyncAllResult(int TotalItemsSynced, int IntegrationsSynced, DateTime SyncedAt);

public interface IIntegrationService
{
    Task<IList<IntegrationData>> GetAllAsync(Guid userId, CancellationToken ct = default);
    Task<OAuthConfig> ConnectAsync(Guid userId, IntegrationProvider provider, string? apiCallbackUrl, string? mobileRedirectUri = null, CancellationToken ct = default);
    Task<IntegrationData> CallbackAsync(Guid userId, IntegrationProvider provider, string code, string? state, string? redirectUri, CancellationToken ct = default);
    Task DisconnectAsync(Guid userId, IntegrationProvider provider, CancellationToken ct = default);
    Task<SyncResult> SyncAsync(Guid userId, IntegrationProvider provider, CancellationToken ct = default);
    Task<SyncAllResult> SyncAllAsync(Guid userId, int minIntervalSeconds = 300, CancellationToken ct = default);
    OAuthStateData? ValidateOAuthState(string state);
}
