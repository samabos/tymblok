using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

/// <summary>
/// Repository for auth-related data access.
/// Note: User management is handled by Identity's UserManager.
/// This repository handles RefreshToken operations.
/// </summary>
public interface IAuthRepository
{
    Task<RefreshToken?> GetRefreshTokenAsync(string token);
    Task<RefreshToken> CreateRefreshTokenAsync(RefreshToken refreshToken);
    Task UpdateRefreshTokenAsync(RefreshToken refreshToken);
    Task SaveChangesAsync();
}
