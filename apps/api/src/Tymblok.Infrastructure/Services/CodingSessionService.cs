using Microsoft.EntityFrameworkCore;
using Tymblok.Core.Entities;
using Tymblok.Core.Interfaces;
using Tymblok.Infrastructure.Data;

namespace Tymblok.Infrastructure.Services;

public class CodingSessionService : ICodingSessionService
{
    private readonly TymblokDbContext _context;

    public CodingSessionService(TymblokDbContext context)
    {
        _context = context;
    }

    public async Task<CodingSession> CreateAsync(
        CodingSession session,
        Guid userId,
        CancellationToken ct = default)
    {
        session.UserId = userId;

        // Validate BlockId belongs to the user if provided
        if (session.BlockId.HasValue)
        {
            var blockExists = await _context.TimeBlocks
                .AnyAsync(b => b.Id == session.BlockId.Value && b.UserId == userId, ct);
            if (!blockExists)
            {
                session.BlockId = null; // Silently unlink — don't fail the session
            }
        }

        _context.CodingSessions.Add(session);
        await _context.SaveChangesAsync(ct);
        return session;
    }

    public async Task<IList<CodingSession>> GetByDateAsync(
        Guid userId,
        DateOnly date,
        CancellationToken ct = default)
    {
        var startOfDay = date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var endOfDay = date.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        return await _context.CodingSessions
            .Where(s => s.UserId == userId
                     && s.StartedAt >= startOfDay
                     && s.StartedAt < endOfDay)
            .OrderBy(s => s.StartedAt)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task<IList<CodingSession>> GetByDateRangeAsync(
        Guid userId,
        DateOnly startDate,
        DateOnly endDate,
        CancellationToken ct = default)
    {
        var start = startDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var end = endDate.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        return await _context.CodingSessions
            .Where(s => s.UserId == userId
                     && s.StartedAt >= start
                     && s.StartedAt < end)
            .OrderBy(s => s.StartedAt)
            .AsNoTracking()
            .ToListAsync(ct);
    }
}
