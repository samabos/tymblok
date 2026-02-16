using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

public record CreateBlockData(
    string Title,
    string? Subtitle,
    Guid CategoryId,
    DateOnly Date,
    TimeOnly StartTime,
    int DurationMinutes,
    bool IsUrgent,
    string? ExternalId,
    string? ExternalUrl,
    // Recurrence
    bool IsRecurring = false,
    Entities.RecurrenceType? RecurrenceType = null,
    int RecurrenceInterval = 1,
    string? RecurrenceDaysOfWeek = null,
    DateOnly? RecurrenceEndDate = null,
    int? RecurrenceMaxOccurrences = null
);

public record UpdateBlockData(
    string? Title,
    string? Subtitle,
    Guid? CategoryId,
    DateOnly? Date,
    TimeOnly? StartTime,
    int? DurationMinutes,
    bool? IsUrgent,
    bool? IsCompleted,
    int? Progress,
    int? SortOrder
);

public record CategoryData(Guid Id, string Name, string Color, string Icon, bool IsSystem, DateTime CreatedAt);

public record BlockWithCategory(TimeBlock Block, CategoryData Category);

public interface IBlockService
{
    /// <summary>
    /// Create a new time block for a user
    /// </summary>
    Task<BlockWithCategory> CreateAsync(CreateBlockData data, Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Get a time block by ID (must be owned by user)
    /// </summary>
    Task<BlockWithCategory?> GetByIdAsync(Guid blockId, Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Get time blocks by date range
    /// </summary>
    Task<IList<TimeBlock>> GetByDateRangeAsync(Guid userId, DateOnly startDate, DateOnly endDate, CancellationToken ct = default);

    /// <summary>
    /// Get time blocks for a specific date
    /// </summary>
    Task<IList<TimeBlock>> GetByDateAsync(Guid userId, DateOnly date, CancellationToken ct = default);

    /// <summary>
    /// Update a time block (must be owned by user)
    /// </summary>
    Task<BlockWithCategory> UpdateAsync(Guid blockId, UpdateBlockData data, Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Mark a time block as completed
    /// </summary>
    Task<BlockWithCategory> CompleteAsync(Guid blockId, Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Start the timer for a time block
    /// </summary>
    Task<BlockWithCategory> StartAsync(Guid blockId, Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Pause the timer for a time block
    /// </summary>
    Task<BlockWithCategory> PauseAsync(Guid blockId, Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Delete a time block (must be owned by user)
    /// </summary>
    Task DeleteAsync(Guid blockId, Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Restore a deleted time block
    /// </summary>
    Task<BlockWithCategory> RestoreAsync(Guid blockId, Guid userId, CancellationToken ct = default);
}
