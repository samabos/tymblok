namespace Tymblok.Core.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
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

    // Account status
    public bool EmailVerified { get; set; } = false;
    public DateTime? EmailVerifiedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? DeletedAt { get; set; } // Soft delete

    // Navigation properties
    public ICollection<TimeBlock> TimeBlocks { get; set; } = new List<TimeBlock>();
    public ICollection<Category> Categories { get; set; } = new List<Category>();
    public ICollection<Integration> Integrations { get; set; } = new List<Integration>();
    public ICollection<InboxItem> InboxItems { get; set; } = new List<InboxItem>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<UserStats> Stats { get; set; } = new List<UserStats>();
}
