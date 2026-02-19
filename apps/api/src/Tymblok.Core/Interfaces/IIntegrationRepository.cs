using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

public interface IIntegrationRepository
{
    Task<Integration?> GetByIdAsync(Guid integrationId);
    Task<Integration?> GetByProviderAsync(Guid userId, IntegrationProvider provider);
    Task<IList<Integration>> GetByUserIdAsync(Guid userId);
    Task<IList<Integration>> GetAllWithActiveTokensAsync(CancellationToken ct = default);
    Task<Integration> CreateAsync(Integration integration);
    void Update(Integration integration);
    void Delete(Integration integration);
    Task SaveChangesAsync(CancellationToken ct = default);
}
