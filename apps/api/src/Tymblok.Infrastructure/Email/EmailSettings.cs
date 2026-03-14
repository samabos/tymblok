namespace Tymblok.Infrastructure.Email;

public class EmailSettings
{
    public const string SectionName = "Email";

    /// <summary>
    /// Resend API key (re_xxxxx)
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Resend API base URL
    /// </summary>
    public string ApiBaseUrl { get; set; } = "https://api.resend.com/";

    /// <summary>
    /// Sender email address
    /// </summary>
    public string FromEmail { get; set; } = "noreply@tymblok.com";

    /// <summary>
    /// Sender display name
    /// </summary>
    public string FromName { get; set; } = "Tymblok";

    /// <summary>
    /// Base URL for links in emails (e.g., https://app.tymblok.app)
    /// </summary>
    public string AppBaseUrl { get; set; } = "http://localhost:8081";
}
