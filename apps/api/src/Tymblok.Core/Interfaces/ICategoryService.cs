using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

public record CreateCategoryData(string Name, string Color, string Icon);
public record UpdateCategoryData(string Name, string Color, string Icon);

public interface ICategoryService
{
    /// <summary>
    /// Create a new category for a user
    /// </summary>
    Task<Category> CreateAsync(CreateCategoryData data, Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Get a category by ID (must be owned by user or be a system category)
    /// </summary>
    Task<Category?> GetByIdAsync(Guid categoryId, Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Get all categories for a user (includes user's categories and system categories)
    /// </summary>
    Task<IList<Category>> GetAllAsync(Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Update a category (must be owned by user and not be a system category)
    /// </summary>
    Task<Category> UpdateAsync(Guid categoryId, UpdateCategoryData data, Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Delete a category (must be owned by user, not be a system category, and not be in use)
    /// </summary>
    Task DeleteAsync(Guid categoryId, Guid userId, CancellationToken ct = default);
}
