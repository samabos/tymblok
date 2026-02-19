using System.ComponentModel.DataAnnotations;
using Tymblok.Core.Entities;

namespace Tymblok.Api.DTOs;

public record CreateBlockRequest(
    [Required][MinLength(1)][MaxLength(200)] string Title,
    [MaxLength(500)] string? Subtitle,
    [Required] Guid CategoryId,
    [Required] DateOnly Date,
    [Required] TimeOnly StartTime,
    [Required][Range(1, 1440)] int DurationMinutes, // Max 24 hours
    bool IsUrgent = false,
    string? ExternalId = null,
    string? ExternalUrl = null,
    IntegrationProvider? ExternalSource = null,
    // Recurrence
    bool IsRecurring = false,
    RecurrenceType? RecurrenceType = null,
    int RecurrenceInterval = 1,
    string? RecurrenceDaysOfWeek = null,
    DateOnly? RecurrenceEndDate = null,
    int? RecurrenceMaxOccurrences = null
);

public record UpdateBlockRequest(
    [MinLength(1)][MaxLength(200)] string? Title = null,
    [MaxLength(500)] string? Subtitle = null,
    Guid? CategoryId = null,
    DateOnly? Date = null,
    TimeOnly? StartTime = null,
    [Range(1, 1440)] int? DurationMinutes = null,
    bool? IsUrgent = null,
    bool? IsCompleted = null,
    [Range(0, 100)] int? Progress = null,
    int? SortOrder = null
);

public record BlockDto(
    Guid Id,
    string Title,
    string? Subtitle,
    Guid CategoryId,
    CategoryDto Category,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int DurationMinutes,
    bool IsUrgent,
    bool IsCompleted,
    int Progress,
    int ElapsedSeconds,
    int SortOrder,
    string? ExternalId,
    string? ExternalUrl,
    IntegrationProvider? ExternalSource,
    DateTime CreatedAt,
    DateTime? CompletedAt,
    // Timer
    TimerState TimerState,
    DateTime? StartedAt,
    DateTime? PausedAt,
    DateTime? ResumedAt,
    // Recurrence
    bool IsRecurring,
    Guid? RecurrenceRuleId,
    RecurrenceRuleDto? RecurrenceRule,
    Guid? RecurrenceParentId
);

public record BlocksResponse(
    IList<BlockDto> Blocks
);

public record CarryOverResponse(
    IList<BlockDto> CarriedOverBlocks,
    int Count
);
