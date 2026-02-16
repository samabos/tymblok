using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

public record CreateInboxItemData(
    string Title,
    string? Description,
    InboxPriority Priority,
    Guid? IntegrationId,
    string? ExternalId,
    string? ExternalUrl
);

public record UpdateInboxItemData(
    string Title,
    string? Description,
    InboxPriority? Priority,
    bool? IsDismissed
);

public record InboxItemFilters(
    bool? IsDismissed = null,
    InboxSource? Source = null,
    InboxPriority? Priority = null
);

public interface IInboxService
{
    /// <summary>
    /// Create a new inbox item for a user
    /// </summary>
    Task<InboxItem> CreateAsync(CreateInboxItemData data, Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Get an inbox item by ID (must be owned by user)
    /// </summary>
    Task<InboxItem?> GetByIdAsync(Guid itemId, Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Get all inbox items for a user with optional filters
    /// </summary>
    Task<IList<InboxItem>> GetAllAsync(Guid userId, InboxItemFilters? filters = null, CancellationToken ct = default);

    /// <summary>
    /// Update an inbox item (must be owned by user)
    /// </summary>
    Task<InboxItem> UpdateAsync(Guid itemId, UpdateInboxItemData data, Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Mark an inbox item as dismissed
    /// </summary>
    Task<InboxItem> DismissAsync(Guid itemId, Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Delete an inbox item (must be owned by user)
    /// </summary>
    Task DeleteAsync(Guid itemId, Guid userId, CancellationToken ct = default);
}
