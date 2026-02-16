using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

public interface IBlockRepository
{
    /// <summary>
    /// Get a time block by ID
    /// </summary>
    Task<TimeBlock?> GetByIdAsync(Guid blockId);

    /// <summary>
    /// Get a time block by ID with user validation (includes Category)
    /// </summary>
    Task<TimeBlock?> GetByIdWithUserAsync(Guid blockId, Guid userId);

    /// <summary>
    /// Get time blocks by date range for a user (includes Category, ordered by date and start time)
    /// </summary>
    Task<IList<TimeBlock>> GetByDateRangeAsync(Guid userId, DateOnly startDate, DateOnly endDate);

    /// <summary>
    /// Get time blocks for a specific date for a user (includes Category, ordered by start time)
    /// </summary>
    Task<IList<TimeBlock>> GetByDateAsync(Guid userId, DateOnly date);

    /// <summary>
    /// Create a new time block
    /// </summary>
    Task<TimeBlock> CreateAsync(TimeBlock block);

    /// <summary>
    /// Update an existing time block
    /// </summary>
    void Update(TimeBlock block);

    /// <summary>
    /// Delete a time block
    /// </summary>
    void Delete(TimeBlock block);

    /// <summary>
    /// Save changes to the database
    /// </summary>
    Task SaveChangesAsync(CancellationToken ct = default);

    /// <summary>
    /// Explicitly load the Category navigation property for a time block
    /// </summary>
    Task LoadCategoryAsync(TimeBlock block, CancellationToken ct = default);

    /// <summary>
    /// Get a time block by ID with user validation (includes Category, uses AsNoTracking)
    /// </summary>
    Task<TimeBlock?> GetByIdWithUserAsNoTrackingAsync(Guid blockId, Guid userId);

    /// <summary>
    /// Detach an entity from the change tracker
    /// </summary>
    void Detach(TimeBlock block);
}
