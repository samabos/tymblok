namespace Tymblok.Core.Entities;

public class AuditLog : BaseEntity
{
    public Guid? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    // Navigation
    public ApplicationUser? User { get; set; }
}

public static class AuditAction
{
    public const string Register = "user.register";
    public const string Login = "user.login";
    public const string LoginFailed = "user.login_failed";
    public const string Logout = "user.logout";
    public const string TokenRefresh = "user.token_refresh";
    public const string TokenRefreshFailed = "user.token_refresh_failed";
    public const string PasswordChange = "user.password_change";

    public const string Create = "create";
    public const string Update = "update";
    public const string Delete = "delete";
}
