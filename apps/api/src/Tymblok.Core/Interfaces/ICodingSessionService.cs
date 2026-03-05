using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

public interface ICodingSessionService
{
    Task<CodingSession> CreateAsync(
        CodingSession session,
        Guid userId,
        CancellationToken ct = default);

    Task<IList<CodingSession>> GetByDateAsync(
        Guid userId,
        DateOnly date,
        CancellationToken ct = default);

    Task<IList<CodingSession>> GetByDateRangeAsync(
        Guid userId,
        DateOnly startDate,
        DateOnly endDate,
        CancellationToken ct = default);
}
