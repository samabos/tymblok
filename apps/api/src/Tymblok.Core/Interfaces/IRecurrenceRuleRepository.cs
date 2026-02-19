using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

public interface IRecurrenceRuleRepository
{
    Task<RecurrenceRule?> GetByIdAsync(Guid id);
    Task CreateAsync(RecurrenceRule rule);
    void Update(RecurrenceRule rule);
    void Delete(RecurrenceRule rule);
    Task SaveChangesAsync(CancellationToken ct = default);
}
