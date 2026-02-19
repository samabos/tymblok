using Microsoft.EntityFrameworkCore;
using Tymblok.Core.Entities;
using Tymblok.Core.Interfaces;
using Tymblok.Infrastructure.Data;

namespace Tymblok.Infrastructure.Repositories;

/// <summary>
/// Repository for inbox item-related data access
/// </summary>
public class InboxRepository : IInboxRepository
{
    private readonly TymblokDbContext _context;

    public InboxRepository(TymblokDbContext context)
    {
        _context = context;
    }

    public async Task<InboxItem?> GetByIdAsync(Guid itemId)
    {
        return await _context.InboxItems
            .FirstOrDefaultAsync(i => i.Id == itemId);
    }

    public async Task<InboxItem?> GetByIdWithUserAsync(Guid itemId, Guid userId)
    {
        return await _context.InboxItems
            .FirstOrDefaultAsync(i => i.Id == itemId && i.UserId == userId);
    }

    public async Task<IList<InboxItem>> GetByUserIdAsync(
        Guid userId,
        bool? isDismissed = null,
        InboxSource? source = null,
        InboxPriority? priority = null)
    {
        var query = _context.InboxItems.Where(i => i.UserId == userId);

        // Apply filters
        if (isDismissed.HasValue)
        {
            query = query.Where(i => i.IsDismissed == isDismissed.Value);
        }

        if (source.HasValue)
        {
            query = query.Where(i => i.Source == source.Value);
        }

        if (priority.HasValue)
        {
            query = query.Where(i => i.Priority == priority.Value);
        }

        return await query
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
    }

    public async Task<IList<InboxItem>> GetRecurringInboxItemsAsync(Guid userId, CancellationToken ct = default)
    {
        return await _context.InboxItems
            .Include(i => i.RecurrenceRule)
            .Where(i => i.UserId == userId
                && i.IsRecurring
                && i.RecurrenceRuleId != null
                && !i.IsDismissed)
            .ToListAsync(ct);
    }

    public async Task<InboxItem> CreateAsync(InboxItem item)
    {
        _context.InboxItems.Add(item);
        return item;
    }

    public void Update(InboxItem item)
    {
        _context.InboxItems.Update(item);
    }

    public void Delete(InboxItem item)
    {
        _context.InboxItems.Remove(item);
    }

    public async Task<InboxItem?> GetByExternalIdAsync(Guid userId, string externalId)
    {
        return await _context.InboxItems
            .FirstOrDefaultAsync(i => i.UserId == userId && i.ExternalId == externalId);
    }

    public async Task<IList<InboxItem>> GetByIntegrationIdAsync(Guid integrationId, CancellationToken ct = default)
    {
        return await _context.InboxItems
            .Where(i => i.IntegrationId == integrationId)
            .ToListAsync(ct);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        await _context.SaveChangesAsync(ct);
    }
}
