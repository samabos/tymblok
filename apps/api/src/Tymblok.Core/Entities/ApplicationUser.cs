using Microsoft.AspNetCore.Identity;

namespace Tymblok.Core.Entities;

/// <summary>
/// Application user extending ASP.NET Core Identity.
/// Keeps all custom Tymblok-specific properties while gaining Identity features.
/// </summary>
public class ApplicationUser : IdentityUser<Guid>
{
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }

    // Settings
    public Theme Theme { get; set; } = Theme.System;
    public bool HighContrast { get; set; } = false;
    public bool ReduceMotion { get; set; } = false;
    public TextSize TextSize { get; set; } = TextSize.Medium;

    // Working hours
    public string Timezone { get; set; } = "UTC";
    public TimeOnly WorkingHoursStart { get; set; } = new(9, 0);
    public TimeOnly WorkingHoursEnd { get; set; } = new(18, 0);
    public TimeOnly LunchStart { get; set; } = new(12, 0);
    public int LunchDurationMinutes { get; set; } = 60;

    // Notification preferences
    public bool NotificationBlockReminder { get; set; } = true;
    public int NotificationReminderMinutes { get; set; } = 5;
    public bool NotificationDailySummary { get; set; } = true;

    // Account status (some overlap with Identity but we keep for backwards compatibility)
    public DateTime? LastLoginAt { get; set; }
    public DateTime? DeletedAt { get; set; } // Soft delete

    // Timestamps (Identity doesn't have these)
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<TimeBlock> TimeBlocks { get; set; } = new List<TimeBlock>();
    public ICollection<Category> Categories { get; set; } = new List<Category>();
    public ICollection<Integration> Integrations { get; set; } = new List<Integration>();
    public ICollection<InboxItem> InboxItems { get; set; } = new List<InboxItem>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<UserStats> Stats { get; set; } = new List<UserStats>();
    public ICollection<UserSession> Sessions { get; set; } = new List<UserSession>();
}
