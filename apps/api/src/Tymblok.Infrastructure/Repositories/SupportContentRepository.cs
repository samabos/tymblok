using Microsoft.EntityFrameworkCore;
using Tymblok.Core.Entities;
using Tymblok.Core.Interfaces;
using Tymblok.Infrastructure.Data;

namespace Tymblok.Infrastructure.Repositories;

public class SupportContentRepository : ISupportContentRepository
{
    private readonly TymblokDbContext _context;

    public SupportContentRepository(TymblokDbContext context)
    {
        _context = context;
    }

    public async Task<SupportContent?> GetByIdAsync(Guid id)
    {
        return await _context.SupportContents
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<SupportContent?> GetBySlugAsync(string slug)
    {
        return await _context.SupportContents
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Slug == slug && c.IsPublished);
    }

    public async Task<IList<SupportContent>> GetAllPublishedAsync()
    {
        return await _context.SupportContents
            .AsNoTracking()
            .Where(c => c.IsPublished)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync();
    }

    public async Task<IList<SupportContent>> GetAllAsync()
    {
        return await _context.SupportContents
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync();
    }

    public async Task<SupportContent> CreateAsync(SupportContent content)
    {
        _context.SupportContents.Add(content);
        return content;
    }

    public void Update(SupportContent content)
    {
        _context.SupportContents.Update(content);
    }

    public void Delete(SupportContent content)
    {
        _context.SupportContents.Remove(content);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        await _context.SaveChangesAsync(ct);
    }
}
