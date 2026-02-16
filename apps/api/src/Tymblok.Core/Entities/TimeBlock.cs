namespace Tymblok.Core.Entities;

public class TimeBlock : BaseEntity
{
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }

    // Scheduling
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int DurationMinutes { get; set; }

    // Status
    public bool IsUrgent { get; set; } = false;
    public bool IsCompleted { get; set; } = false;
    public DateTime? CompletedAt { get; set; }

    // Tracking
    public int Progress { get; set; } = 0; // 0-100
    public int ElapsedSeconds { get; set; } = 0;

    // Timer
    public TimerState TimerState { get; set; } = TimerState.NotStarted;
    public DateTime? StartedAt { get; set; }
    public DateTime? PausedAt { get; set; }
    public DateTime? ResumedAt { get; set; }

    // Ordering
    public int SortOrder { get; set; }

    // External reference (from integration)
    public string? ExternalId { get; set; }
    public string? ExternalUrl { get; set; }
    public IntegrationProvider? ExternalSource { get; set; }

    // Recurrence
    public bool IsRecurring { get; set; } = false;
    public Guid? RecurrenceRuleId { get; set; }
    public RecurrenceRule? RecurrenceRule { get; set; }

    // For recurring blocks: ID of the "master" instance (first occurrence)
    // All instances share the same RecurrenceRuleId but have different dates
    public Guid? RecurrenceParentId { get; set; }

    // Soft delete
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
}
