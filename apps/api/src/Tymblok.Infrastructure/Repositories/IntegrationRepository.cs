using Microsoft.EntityFrameworkCore;
using Tymblok.Core.Entities;
using Tymblok.Core.Interfaces;
using Tymblok.Infrastructure.Data;

namespace Tymblok.Infrastructure.Repositories;

public class IntegrationRepository : IIntegrationRepository
{
    private readonly TymblokDbContext _context;

    public IntegrationRepository(TymblokDbContext context)
    {
        _context = context;
    }

    public async Task<Integration?> GetByIdAsync(Guid integrationId)
    {
        return await _context.Integrations
            .FirstOrDefaultAsync(i => i.Id == integrationId);
    }

    public async Task<Integration?> GetByProviderAsync(Guid userId, IntegrationProvider provider)
    {
        return await _context.Integrations
            .FirstOrDefaultAsync(i => i.UserId == userId && i.Provider == provider);
    }

    public async Task<IList<Integration>> GetByUserIdAsync(Guid userId)
    {
        return await _context.Integrations
            .Where(i => i.UserId == userId)
            .OrderBy(i => i.Provider)
            .ToListAsync();
    }

    public async Task<IList<Integration>> GetAllWithActiveTokensAsync(CancellationToken ct = default)
    {
        return await _context.Integrations
            .Where(i => i.AccessToken != string.Empty)
            .ToListAsync(ct);
    }

    public async Task<Integration> CreateAsync(Integration integration)
    {
        _context.Integrations.Add(integration);
        return integration;
    }

    public void Update(Integration integration)
    {
        _context.Integrations.Update(integration);
    }

    public void Delete(Integration integration)
    {
        _context.Integrations.Remove(integration);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        await _context.SaveChangesAsync(ct);
    }
}
