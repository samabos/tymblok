using Microsoft.EntityFrameworkCore;
using Tymblok.Core.Entities;
using Tymblok.Core.Interfaces;
using Tymblok.Infrastructure.Data;

namespace Tymblok.Infrastructure.Repositories;

public class RecurrenceRuleRepository : IRecurrenceRuleRepository
{
    private readonly TymblokDbContext _context;

    public RecurrenceRuleRepository(TymblokDbContext context)
    {
        _context = context;
    }

    public async Task<RecurrenceRule?> GetByIdAsync(Guid id)
    {
        return await _context.RecurrenceRules
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task CreateAsync(RecurrenceRule rule)
    {
        await _context.RecurrenceRules.AddAsync(rule);
    }

    public void Update(RecurrenceRule rule)
    {
        _context.RecurrenceRules.Update(rule);
    }

    public void Delete(RecurrenceRule rule)
    {
        _context.RecurrenceRules.Remove(rule);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        await _context.SaveChangesAsync(ct);
    }
}
