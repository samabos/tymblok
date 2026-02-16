using System.ComponentModel.DataAnnotations;

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
    string? ExternalUrl = null
);

public record UpdateBlockRequest(
    [Required][MinLength(1)][MaxLength(200)] string Title,
    [MaxLength(500)] string? Subtitle,
    Guid? CategoryId = null,
    DateOnly? Date = null,
    TimeOnly? StartTime = null,
    [Range(1, 1440)] int? DurationMinutes = null,
    bool? IsUrgent = null,
    bool? IsCompleted = null,
    [Range(0, 100)] int? Progress = null
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
    DateTime CreatedAt,
    DateTime? CompletedAt
);

public record BlocksResponse(
    IList<BlockDto> Blocks
);
