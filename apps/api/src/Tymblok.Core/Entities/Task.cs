namespace Tymblok.Core.Entities;

public class Task
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public int DurationMinutes { get; set; } = 30;
    public string Source { get; set; } = "manual";
    public string? SourceId { get; set; }
    public string? SourceUrl { get; set; }
    public string? SourceMetadata { get; set; } // JSON
    public string Priority { get; set; } = "medium";
    public bool IsRecurring { get; set; }
    public string? RecurrenceRule { get; set; } // JSON
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool IsArchived { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public Category? Category { get; set; }
}
