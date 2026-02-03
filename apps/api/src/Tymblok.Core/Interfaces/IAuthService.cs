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

    /// <summary>
    /// Process external login callback and return tokens.
    /// Links to existing account by email if found, otherwise creates new user.
    /// </summary>
    Task<AuthResult> ExternalLoginAsync(
        string provider,
        string providerKey,
        string? email,
        string? name,
        string? avatarUrl,
        string? ipAddress = null);

    /// <summary>
    /// Link an external provider to an existing user account
    /// </summary>
    Task LinkExternalLoginAsync(
        Guid userId,
        string provider,
        string providerKey,
        string? email = null);

    /// <summary>
    /// Unlink an external provider from a user account
    /// </summary>
    Task UnlinkExternalLoginAsync(Guid userId, string provider);

    /// <summary>
    /// Get all linked external providers for a user
    /// </summary>
    Task<IList<string>> GetLinkedProvidersAsync(Guid userId);

    /// <summary>
    /// Check if a user has a password set
    /// </summary>
    Task<bool> HasPasswordAsync(Guid userId);

    /// <summary>
    /// Change password for a user who already has a password
    /// </summary>
    Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword);

    /// <summary>
    /// Set password for an OAuth-only user who doesn't have a password
    /// </summary>
    Task SetPasswordAsync(Guid userId, string password);
}
