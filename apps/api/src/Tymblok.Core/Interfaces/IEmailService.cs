namespace Tymblok.Core.Interfaces;

/// <summary>
/// Email sending service interface
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Send an email verification link to the user
    /// </summary>
    Task SendEmailVerificationAsync(string email, string name, string verificationLink, CancellationToken ct = default);

    /// <summary>
    /// Send a password reset link to the user
    /// </summary>
    Task SendPasswordResetAsync(string email, string name, string resetLink, CancellationToken ct = default);

    /// <summary>
    /// Send a password changed notification
    /// </summary>
    Task SendPasswordChangedNotificationAsync(string email, string name, CancellationToken ct = default);

    /// <summary>
    /// Send a welcome email after registration
    /// </summary>
    Task SendWelcomeEmailAsync(string email, string name, CancellationToken ct = default);
}
