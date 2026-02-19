using Microsoft.EntityFrameworkCore;
using Tymblok.Core.Entities;
using Tymblok.Core.Interfaces;
using Tymblok.Infrastructure.Data;

namespace Tymblok.Infrastructure.Repositories;

/// <summary>
/// Repository for time block-related data access
/// </summary>
public class BlockRepository : IBlockRepository
{
    private readonly TymblokDbContext _context;

    public BlockRepository(TymblokDbContext context)
    {
        _context = context;
    }

    public async Task<TimeBlock?> GetByIdAsync(Guid blockId)
    {
        return await _context.TimeBlocks
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.Id == blockId);
    }

    public async Task<TimeBlock?> GetByIdWithUserAsync(Guid blockId, Guid userId)
    {
        return await _context.TimeBlocks
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.Id == blockId && b.UserId == userId);
    }

    public async Task<IList<TimeBlock>> GetByDateRangeAsync(Guid userId, DateOnly startDate, DateOnly endDate)
    {
        return await _context.TimeBlocks
            .Include(b => b.Category)
            .Where(b => b.UserId == userId && b.Date >= startDate && b.Date <= endDate)
            .OrderBy(b => b.Date)
            .ThenBy(b => b.StartTime)
            .ThenBy(b => b.SortOrder)
            .ToListAsync();
    }

    public async Task<IList<TimeBlock>> GetByDateAsync(Guid userId, DateOnly date)
    {
        return await _context.TimeBlocks
            .Include(b => b.Category)
            .Where(b => b.UserId == userId && b.Date == date)
            .OrderBy(b => b.StartTime)
            .ThenBy(b => b.SortOrder)
            .ToListAsync();
    }

    public async Task<IList<TimeBlock>> GetRecurringParentBlocksAsync(Guid userId, CancellationToken ct = default)
    {
        return await _context.TimeBlocks
            .Include(b => b.Category)
            .Include(b => b.RecurrenceRule)
            .Where(b => b.UserId == userId
                && b.IsRecurring
                && b.RecurrenceParentId == null
                && b.RecurrenceRuleId != null)
            .ToListAsync(ct);
    }

    public async Task<IList<TimeBlock>> GetByRecurrenceRuleAsync(Guid recurrenceRuleId, Guid userId, CancellationToken ct = default)
    {
        return await _context.TimeBlocks
            .Include(b => b.Category)
            .Where(b => b.UserId == userId && b.RecurrenceRuleId == recurrenceRuleId)
            .OrderBy(b => b.Date)
            .ThenBy(b => b.StartTime)
            .ToListAsync(ct);
    }

    public async Task<TimeBlock> CreateAsync(TimeBlock block)
    {
        _context.TimeBlocks.Add(block);
        return block;
    }

    public void Update(TimeBlock block)
    {
        _context.TimeBlocks.Update(block);
    }

    public void Delete(TimeBlock block)
    {
        _context.TimeBlocks.Remove(block);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        await _context.SaveChangesAsync(ct);
    }

    public async Task LoadCategoryAsync(TimeBlock block, CancellationToken ct = default)
    {
        // Detach the entity to force a fresh load
        _context.Entry(block).State = Microsoft.EntityFrameworkCore.EntityState.Detached;

        // Reload with Category included
        var reloaded = await _context.TimeBlocks
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.Id == block.Id, ct);

        // Copy the Category reference to the original entity
        if (reloaded != null)
        {
            block.Category = reloaded.Category;
        }
    }

    public async Task<TimeBlock?> GetByIdWithUserAsNoTrackingAsync(Guid blockId, Guid userId)
    {
        return await _context.TimeBlocks
            .AsNoTracking()
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.Id == blockId && b.UserId == userId);
    }

    public void Detach(TimeBlock block)
    {
        _context.Entry(block).State = Microsoft.EntityFrameworkCore.EntityState.Detached;
    }

    public async Task<TimeBlock?> GetByExternalIdAsync(Guid userId, string externalId)
    {
        return await _context.TimeBlocks
            .FirstOrDefaultAsync(b => b.UserId == userId && b.ExternalId == externalId);
    }

    public async Task<IList<TimeBlock>> GetUncompletedPastBlocksAsync(Guid userId, DateOnly today, CancellationToken ct = default)
    {
        return await _context.TimeBlocks
            .Include(b => b.Category)
            .Where(b => b.UserId == userId
                && b.Date < today
                && !b.IsCompleted
                && b.TimerState != TimerState.Completed
                && !b.IsRecurring)
            .OrderBy(b => b.Date)
            .ThenBy(b => b.SortOrder)
            .ToListAsync(ct);
    }
}
