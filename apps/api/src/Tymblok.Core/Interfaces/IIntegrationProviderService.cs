using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

public record OAuthConfig(string AuthUrl, string State);

public record OAuthTokenResult(
    string AccessToken,
    string? RefreshToken,
    DateTime? ExpiresAt,
    string ExternalUserId,
    string? ExternalUsername,
    string? ExternalAvatarUrl
);

public record SyncResult(int ItemsSynced, DateTime SyncedAt);

public interface IIntegrationProviderService
{
    IntegrationProvider Provider { get; }
    Task<OAuthConfig> GetAuthUrlAsync(Guid userId, string? redirectUri, string? mobileRedirectUri = null, CancellationToken ct = default);
    Task<OAuthTokenResult> ExchangeCodeAsync(string code, string? redirectUri, CancellationToken ct = default);
    Task<SyncResult> SyncAsync(Integration integration, Guid userId, CancellationToken ct = default);
    Task RevokeAccessAsync(Integration integration, CancellationToken ct = default);
    Task<OAuthTokenResult?> RefreshTokenAsync(Integration integration, CancellationToken ct = default);
}
