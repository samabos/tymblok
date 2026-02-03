using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

/// <summary>
/// Repository for auth-related data access.
/// Note: User management is handled by Identity's UserManager.
/// This repository handles RefreshToken and UserSession operations.
/// </summary>
public interface IAuthRepository
{
    // RefreshToken operations
    Task<RefreshToken?> GetRefreshTokenAsync(string token);
    Task<RefreshToken> CreateRefreshTokenAsync(RefreshToken refreshToken);
    Task UpdateRefreshTokenAsync(RefreshToken refreshToken);

    // Session operations
    Task<IList<UserSession>> GetActiveSessionsAsync(Guid userId);
    Task<UserSession?> GetSessionByIdAsync(Guid sessionId);
    Task<UserSession> CreateSessionAsync(UserSession session);
    Task UpdateSessionAsync(UserSession session);

    Task SaveChangesAsync();
}
