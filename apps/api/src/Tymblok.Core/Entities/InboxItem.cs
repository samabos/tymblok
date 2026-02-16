namespace Tymblok.Core.Entities;

public class InboxItem : BaseEntity
{
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public Guid? IntegrationId { get; set; }
    public Integration? Integration { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    public InboxSource Source { get; set; }
    public InboxItemType Type { get; set; }
    public InboxPriority Priority { get; set; } = InboxPriority.Medium;

    // External reference
    public string? ExternalId { get; set; }
    public string? ExternalUrl { get; set; }

    // Status
    public bool IsDismissed { get; set; } = false;
    public DateTime? DismissedAt { get; set; }
    public bool IsScheduled { get; set; } = false;
    public Guid? ScheduledBlockId { get; set; }

    // Recurrence
    public bool IsRecurring { get; set; } = false;
    public Guid? RecurrenceRuleId { get; set; }
    public RecurrenceRule? RecurrenceRule { get; set; }
}
