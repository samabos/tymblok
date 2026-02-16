using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

public interface ICategoryRepository
{
    /// <summary>
    /// Get a category by ID
    /// </summary>
    Task<Category?> GetByIdAsync(Guid categoryId);

    /// <summary>
    /// Get a category by ID with user validation
    /// </summary>
    Task<Category?> GetByIdWithUserAsync(Guid categoryId, Guid userId);

    /// <summary>
    /// Get all categories for a user (includes user's categories and system categories)
    /// </summary>
    Task<IList<Category>> GetByUserIdAsync(Guid userId);

    /// <summary>
    /// Get all system categories
    /// </summary>
    Task<IList<Category>> GetSystemCategoriesAsync();

    /// <summary>
    /// Check if a category is being used by any time blocks
    /// </summary>
    Task<bool> IsInUseAsync(Guid categoryId);

    /// <summary>
    /// Create a new category
    /// </summary>
    Task<Category> CreateAsync(Category category);

    /// <summary>
    /// Update an existing category
    /// </summary>
    void Update(Category category);

    /// <summary>
    /// Delete a category
    /// </summary>
    void Delete(Category category);

    /// <summary>
    /// Save changes to the database
    /// </summary>
    Task SaveChangesAsync(CancellationToken ct = default);
}
