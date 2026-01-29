namespace Tymblok.Core.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Timezone { get; set; } = "UTC";
    public TimeOnly WorkingHoursStart { get; set; } = new(9, 0);
    public TimeOnly WorkingHoursEnd { get; set; } = new(18, 0);
    public TimeOnly LunchStart { get; set; } = new(12, 0);
    public int LunchDurationMinutes { get; set; } = 60;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<OAuthConnection> OAuthConnections { get; set; } = new List<OAuthConnection>();
    public ICollection<Category> Categories { get; set; } = new List<Category>();
    public ICollection<Task> Tasks { get; set; } = new List<Task>();
    public ICollection<ScheduledBlock> ScheduledBlocks { get; set; } = new List<ScheduledBlock>();
}
