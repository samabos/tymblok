using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using Tymblok.Core.Interfaces;

namespace Tymblok.Infrastructure.Email;

/// <summary>
/// Email service implementation using MailKit
/// For development, configure Ethereal Email credentials
/// </summary>
public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> settings, ILogger<EmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendEmailVerificationAsync(string email, string name, string verificationLink, CancellationToken ct = default)
    {
        var subject = "Verify your Tymblok email";
        var htmlBody = $@"
            <html>
            <body style='font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h1 style='color: #6366f1;'>Welcome to Tymblok, {EscapeHtml(name)}!</h1>
                <p>Please verify your email address to complete your registration.</p>
                <p style='margin: 30px 0;'>
                    <a href='{verificationLink}'
                       style='background-color: #6366f1; color: white; padding: 12px 24px;
                              text-decoration: none; border-radius: 8px; font-weight: 600;'>
                        Verify Email
                    </a>
                </p>
                <p style='color: #64748b; font-size: 14px;'>
                    Or copy and paste this link: <br>
                    <a href='{verificationLink}' style='color: #6366f1;'>{verificationLink}</a>
                </p>
                <p style='color: #64748b; font-size: 14px;'>
                    This link will expire in 24 hours.
                </p>
                <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;'>
                <p style='color: #94a3b8; font-size: 12px;'>
                    If you didn't create a Tymblok account, you can safely ignore this email.
                </p>
            </body>
            </html>";

        var plainTextBody = $@"
Welcome to Tymblok, {name}!

Please verify your email address to complete your registration.

Click here to verify: {verificationLink}

This link will expire in 24 hours.

If you didn't create a Tymblok account, you can safely ignore this email.";

        await SendEmailAsync(email, subject, htmlBody, plainTextBody, ct);
    }

    public async Task SendPasswordResetAsync(string email, string name, string resetLink, CancellationToken ct = default)
    {
        var subject = "Reset your Tymblok password";
        var htmlBody = $@"
            <html>
            <body style='font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h1 style='color: #6366f1;'>Password Reset Request</h1>
                <p>Hi {EscapeHtml(name)},</p>
                <p>We received a request to reset your password. Click the button below to create a new password.</p>
                <p style='margin: 30px 0;'>
                    <a href='{resetLink}'
                       style='background-color: #6366f1; color: white; padding: 12px 24px;
                              text-decoration: none; border-radius: 8px; font-weight: 600;'>
                        Reset Password
                    </a>
                </p>
                <p style='color: #64748b; font-size: 14px;'>
                    Or copy and paste this link: <br>
                    <a href='{resetLink}' style='color: #6366f1;'>{resetLink}</a>
                </p>
                <p style='color: #64748b; font-size: 14px;'>
                    This link will expire in 1 hour.
                </p>
                <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;'>
                <p style='color: #94a3b8; font-size: 12px;'>
                    If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
                </p>
            </body>
            </html>";

        var plainTextBody = $@"
Password Reset Request

Hi {name},

We received a request to reset your password. Click the link below to create a new password.

Reset your password: {resetLink}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.";

        await SendEmailAsync(email, subject, htmlBody, plainTextBody, ct);
    }

    public async Task SendPasswordChangedNotificationAsync(string email, string name, CancellationToken ct = default)
    {
        var subject = "Your Tymblok password was changed";
        var htmlBody = $@"
            <html>
            <body style='font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h1 style='color: #6366f1;'>Password Changed</h1>
                <p>Hi {EscapeHtml(name)},</p>
                <p>Your Tymblok password was successfully changed.</p>
                <p style='color: #64748b; font-size: 14px;'>
                    If you didn't make this change, please contact support immediately
                    or reset your password.
                </p>
                <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;'>
                <p style='color: #94a3b8; font-size: 12px;'>
                    This is an automated security notification from Tymblok.
                </p>
            </body>
            </html>";

        var plainTextBody = $@"
Password Changed

Hi {name},

Your Tymblok password was successfully changed.

If you didn't make this change, please contact support immediately or reset your password.

This is an automated security notification from Tymblok.";

        await SendEmailAsync(email, subject, htmlBody, plainTextBody, ct);
    }

    public async Task SendWelcomeEmailAsync(string email, string name, CancellationToken ct = default)
    {
        var subject = "Welcome to Tymblok!";
        var htmlBody = $@"
            <html>
            <body style='font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h1 style='color: #6366f1;'>Welcome to Tymblok!</h1>
                <p>Hi {EscapeHtml(name)},</p>
                <p>Thanks for joining Tymblok! We're excited to help you master your time and boost your productivity.</p>
                <h2 style='color: #334155; font-size: 18px;'>Get Started</h2>
                <ul style='color: #475569;'>
                    <li>Create your first time block</li>
                    <li>Connect your GitHub and Jira accounts</li>
                    <li>Sync your calendar</li>
                    <li>Start tracking your focus time</li>
                </ul>
                <p style='margin: 30px 0;'>
                    <a href='{_settings.AppBaseUrl}'
                       style='background-color: #6366f1; color: white; padding: 12px 24px;
                              text-decoration: none; border-radius: 8px; font-weight: 600;'>
                        Open Tymblok
                    </a>
                </p>
                <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;'>
                <p style='color: #94a3b8; font-size: 12px;'>
                    Need help? Reply to this email and we'll get back to you.
                </p>
            </body>
            </html>";

        var plainTextBody = $@"
Welcome to Tymblok!

Hi {name},

Thanks for joining Tymblok! We're excited to help you master your time and boost your productivity.

Get Started:
- Create your first time block
- Connect your GitHub and Jira accounts
- Sync your calendar
- Start tracking your focus time

Open Tymblok: {_settings.AppBaseUrl}

Need help? Reply to this email and we'll get back to you.";

        await SendEmailAsync(email, subject, htmlBody, plainTextBody, ct);
    }

    private async Task SendEmailAsync(string to, string subject, string htmlBody, string plainTextBody, CancellationToken ct)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromEmail));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;

        var builder = new BodyBuilder
        {
            HtmlBody = htmlBody,
            TextBody = plainTextBody
        };
        message.Body = builder.ToMessageBody();

        try
        {
            using var client = new SmtpClient();

            var secureSocketOptions = _settings.UseSsl
                ? SecureSocketOptions.SslOnConnect
                : _settings.UseStartTls
                    ? SecureSocketOptions.StartTls
                    : SecureSocketOptions.None;

            await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, secureSocketOptions, ct);

            if (!string.IsNullOrEmpty(_settings.SmtpUsername))
            {
                await client.AuthenticateAsync(_settings.SmtpUsername, _settings.SmtpPassword, ct);
            }

            var response = await client.SendAsync(message, ct);
            _logger.LogInformation("Email sent to {Email}, subject: {Subject}, response: {Response}", to, subject, response);

            await client.DisconnectAsync(true, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}, subject: {Subject}", to, subject);
            throw;
        }
    }

    private static string EscapeHtml(string text)
    {
        return System.Web.HttpUtility.HtmlEncode(text);
    }
}
