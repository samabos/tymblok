using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

public interface IAuthRepository
{
    Task<User?> GetUserByEmailAsync(string email);
    Task<User> CreateUserAsync(User user);
    Task UpdateUserAsync(User user);
    Task<RefreshToken?> GetRefreshTokenAsync(string token);
    Task<RefreshToken> CreateRefreshTokenAsync(RefreshToken refreshToken);
    Task UpdateRefreshTokenAsync(RefreshToken refreshToken);
    Task SaveChangesAsync();
}
