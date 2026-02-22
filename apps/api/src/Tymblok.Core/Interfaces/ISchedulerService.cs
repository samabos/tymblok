using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

// ============================================================================
// Data Records
// ============================================================================

public record AutoPlanData(DateOnly Date, List<Guid>? InboxItemIds = null);

public record ReplanData(DateOnly Date, List<Guid>? KeepBlockIds = null);

public record ScheduleProposal(
    List<ProposedBlock> ProposedBlocks,
    ScheduleQualityScore Score,
    List<string> Warnings);

public record ProposedBlock(
    string Title,
    string? Subtitle,
    Guid CategoryId,
    string CategoryName,
    string CategoryColor,
    string CategoryIcon,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int DurationMinutes,
    bool IsUrgent,
    Guid? InboxItemId,
    string Zone);

public record ScheduleQualityScore(
    int Overall,
    int FocusTimeScore,
    int PriorityCoverage,
    int ContextSwitchScore,
    int BufferTimeScore);

// ============================================================================
// Service Interface
// ============================================================================

public interface ISchedulerService
{
    /// <summary>
    /// Generate an optimized schedule proposal for a given date.
    /// Loads unscheduled inbox items, builds zones from user preferences,
    /// and places tasks using the zone-based pipeline.
    /// </summary>
    Task<ScheduleProposal> AutoPlanAsync(AutoPlanData data, Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Regenerate a schedule for a date, optionally keeping specific blocks fixed.
    /// Non-kept blocks are treated as reschedulable and their inbox items re-enter the pool.
    /// </summary>
    Task<ScheduleProposal> ReplanAsync(ReplanData data, Guid userId, CancellationToken ct = default);
}
