using Microsoft.EntityFrameworkCore;
using Tymblok.Core.Entities;
using Tymblok.Core.Interfaces;
using Tymblok.Infrastructure.Data;

namespace Tymblok.Infrastructure.Repositories;

/// <summary>
/// Repository for category-related data access
/// </summary>
public class CategoryRepository : ICategoryRepository
{
    private readonly TymblokDbContext _context;

    public CategoryRepository(TymblokDbContext context)
    {
        _context = context;
    }

    public async Task<Category?> GetByIdAsync(Guid categoryId)
    {
        return await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == categoryId);
    }

    public async Task<Category?> GetByIdWithUserAsync(Guid categoryId, Guid userId)
    {
        return await _context.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == categoryId && (c.UserId == userId || c.UserId == null));
    }

    public async Task<IList<Category>> GetByUserIdAsync(Guid userId)
    {
        // Return both user categories AND system categories
        return await _context.Categories
            .Where(c => c.UserId == userId || c.UserId == null)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<IList<Category>> GetSystemCategoriesAsync()
    {
        return await _context.Categories
            .Where(c => c.IsSystem)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<bool> IsInUseAsync(Guid categoryId)
    {
        return await _context.TimeBlocks
            .AnyAsync(tb => tb.CategoryId == categoryId);
    }

    public async Task<Category> CreateAsync(Category category)
    {
        _context.Categories.Add(category);
        return category;
    }

    public void Update(Category category)
    {
        _context.Categories.Update(category);
    }

    public void Delete(Category category)
    {
        _context.Categories.Remove(category);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        await _context.SaveChangesAsync(ct);
    }
}
