namespace Tymblok.Core.Entities;

public enum RecurrenceType
{
    Daily,
    Weekly,
    Monthly
}

public class RecurrenceRule : BaseEntity
{
    public RecurrenceType Type { get; set; }

    // How often: every N days/weeks/months
    public int Interval { get; set; } = 1;

    // For weekly recurrence: which days (0=Sunday, 6=Saturday)
    // Stored as comma-separated values: "1,3,5" for Mon,Wed,Fri
    public string? DaysOfWeek { get; set; }

    // When to stop generating instances
    public DateOnly? EndDate { get; set; }

    // Or stop after N occurrences (alternative to EndDate)
    public int? MaxOccurrences { get; set; }

    // Navigation property - all blocks created from this rule
    public ICollection<TimeBlock> TimeBlocks { get; set; } = new List<TimeBlock>();
}
