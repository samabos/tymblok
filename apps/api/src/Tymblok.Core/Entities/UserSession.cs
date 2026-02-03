namespace Tymblok.Core.Entities;

/// <summary>
/// Represents a user session/device for session management.
/// Links to a RefreshToken for auth tracking.
/// </summary>
public class UserSession : BaseEntity
{
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public Guid RefreshTokenId { get; set; }
    public RefreshToken RefreshToken { get; set; } = null!;

    // Device info (basic tracking only, no geo-location for privacy)
    public string? DeviceType { get; set; }    // "mobile", "desktop", "web"
    public string? DeviceName { get; set; }    // "iPhone 15", "Chrome on Windows"
    public string? DeviceOs { get; set; }      // "iOS 17", "Android 14", "Windows 11"
    public string? IpAddress { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsCurrent { get; set; }
    public DateTime LastActiveAt { get; set; } = DateTime.UtcNow;
    public DateTime? RevokedAt { get; set; }

    /// <summary>
    /// Session is considered active if not revoked and linked refresh token is still active
    /// </summary>
    public bool IsSessionActive => IsActive && RevokedAt == null && RefreshToken?.IsActive == true;
}
