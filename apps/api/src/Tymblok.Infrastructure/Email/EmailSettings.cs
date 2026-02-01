namespace Tymblok.Infrastructure.Email;

/// <summary>
/// Email service configuration settings
/// For development, use Ethereal Email (https://ethereal.email/)
/// </summary>
public class EmailSettings
{
    public const string SectionName = "Email";

    /// <summary>
    /// SMTP server host (e.g., smtp.ethereal.email for dev)
    /// </summary>
    public string SmtpHost { get; set; } = "smtp.ethereal.email";

    /// <summary>
    /// SMTP server port (587 for TLS, 465 for SSL)
    /// </summary>
    public int SmtpPort { get; set; } = 587;

    /// <summary>
    /// SMTP username (Ethereal email address)
    /// </summary>
    public string SmtpUsername { get; set; } = string.Empty;

    /// <summary>
    /// SMTP password (Ethereal password)
    /// </summary>
    public string SmtpPassword { get; set; } = string.Empty;

    /// <summary>
    /// Use SSL/TLS for SMTP connection
    /// </summary>
    public bool UseSsl { get; set; } = false;

    /// <summary>
    /// Use STARTTLS for SMTP connection
    /// </summary>
    public bool UseStartTls { get; set; } = true;

    /// <summary>
    /// Sender email address
    /// </summary>
    public string FromEmail { get; set; } = "noreply@tymblok.app";

    /// <summary>
    /// Sender display name
    /// </summary>
    public string FromName { get; set; } = "Tymblok";

    /// <summary>
    /// Base URL for links in emails (e.g., https://app.tymblok.app)
    /// </summary>
    public string AppBaseUrl { get; set; } = "http://localhost:8081";
}
