using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

public record AuthResult(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    User User
);

public record RefreshResult(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn
);

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(string email, string password, string name, string? ipAddress = null);
    Task<AuthResult> LoginAsync(string email, string password, string? ipAddress = null);
    Task<RefreshResult> RefreshTokenAsync(string refreshToken, string? ipAddress = null);
    Task RevokeTokenAsync(string refreshToken, string? ipAddress = null);
}
