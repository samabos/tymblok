using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

public interface IInboxRepository
{
    /// <summary>
    /// Get an inbox item by ID
    /// </summary>
    Task<InboxItem?> GetByIdAsync(Guid itemId);

    /// <summary>
    /// Get an inbox item by ID with user validation
    /// </summary>
    Task<InboxItem?> GetByIdWithUserAsync(Guid itemId, Guid userId);

    /// <summary>
    /// Get all inbox items for a user with optional filters
    /// </summary>
    Task<IList<InboxItem>> GetByUserIdAsync(
        Guid userId,
        bool? isDismissed = null,
        InboxSource? source = null,
        InboxPriority? priority = null);

    /// <summary>
    /// Get all recurring inbox items for a user (includes RecurrenceRule navigation property)
    /// </summary>
    Task<IList<InboxItem>> GetRecurringInboxItemsAsync(Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Create a new inbox item
    /// </summary>
    Task<InboxItem> CreateAsync(InboxItem item);

    /// <summary>
    /// Update an existing inbox item
    /// </summary>
    void Update(InboxItem item);

    /// <summary>
    /// Delete an inbox item
    /// </summary>
    void Delete(InboxItem item);

    /// <summary>
    /// Save changes to the database
    /// </summary>
    Task SaveChangesAsync(CancellationToken ct = default);
}
