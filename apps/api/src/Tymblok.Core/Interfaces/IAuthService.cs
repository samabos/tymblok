using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

public record AuthResult(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    ApplicationUser User
);

public record RefreshResult(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn
);

public interface IAuthService
{
    /// <summary>
    /// Register a new user and assign default role
    /// </summary>
    Task<AuthResult> RegisterAsync(string email, string password, string name, string? ipAddress = null);

    /// <summary>
    /// Login with email and password
    /// </summary>
    Task<AuthResult> LoginAsync(string email, string password, string? ipAddress = null);

    /// <summary>
    /// Refresh access token using refresh token
    /// </summary>
    Task<RefreshResult> RefreshTokenAsync(string refreshToken, string? ipAddress = null);

    /// <summary>
    /// Revoke a refresh token (logout)
    /// </summary>
    Task RevokeTokenAsync(string refreshToken, string? ipAddress = null);

    /// <summary>
    /// Send email verification link
    /// </summary>
    Task SendEmailVerificationAsync(Guid userId);

    /// <summary>
    /// Verify email with token
    /// </summary>
    Task<bool> VerifyEmailAsync(Guid userId, string token);

    /// <summary>
    /// Send password reset link
    /// </summary>
    Task SendPasswordResetAsync(string email);

    /// <summary>
    /// Reset password with token
    /// </summary>
    Task<bool> ResetPasswordAsync(string email, string token, string newPassword);
}
