using System.ComponentModel.DataAnnotations;

namespace Tymblok.Api.DTOs;

// ============================================================================
// Requests
// ============================================================================

public record AutoPlanRequest(
    [Required] DateOnly Date,
    List<Guid>? InboxItemIds = null);

public record ReplanRequest(
    [Required] DateOnly Date,
    List<Guid>? KeepBlockIds = null);

public record AcceptPlanRequest(
    [Required] List<AcceptedBlock> Blocks);

public record AcceptedBlock(
    [Required][MinLength(1)][MaxLength(200)] string Title,
    [MaxLength(500)] string? Subtitle,
    [Required] Guid CategoryId,
    [Required] DateOnly Date,
    [Required] TimeOnly StartTime,
    [Required][Range(1, 1440)] int DurationMinutes,
    bool IsUrgent = false,
    Guid? InboxItemId = null);

// ============================================================================
// Responses
// ============================================================================

public record ProposedBlockDto(
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

public record ScheduleScoreDto(
    int Overall,
    int FocusTimeScore,
    int PriorityCoverage,
    int ContextSwitchScore,
    int BufferTimeScore);

public record ScheduleProposalResponse(
    List<ProposedBlockDto> ProposedBlocks,
    ScheduleScoreDto Score,
    List<string> Warnings);

public record AcceptPlanResponse(
    IList<BlockDto> CreatedBlocks,
    int Count);
