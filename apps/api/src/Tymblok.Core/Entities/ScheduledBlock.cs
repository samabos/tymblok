namespace Tymblok.Core.Entities;

public class ScheduledBlock
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? TaskId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public DateTime? ActualStartTime { get; set; }
    public DateTime? ActualEndTime { get; set; }
    public string Status { get; set; } = "scheduled";
    public string Source { get; set; } = "tymblok";
    public string? ExternalEventId { get; set; }
    public string Color { get; set; } = "#6366F1";
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public Task? Task { get; set; }
}
