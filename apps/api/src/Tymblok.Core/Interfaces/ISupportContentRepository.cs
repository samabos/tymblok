using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

public interface ISupportContentRepository
{
    Task<SupportContent?> GetByIdAsync(Guid id);
    Task<SupportContent?> GetBySlugAsync(string slug);
    Task<IList<SupportContent>> GetAllPublishedAsync();
    Task<IList<SupportContent>> GetAllAsync();
    Task<SupportContent> CreateAsync(SupportContent content);
    void Update(SupportContent content);
    void Delete(SupportContent content);
    Task SaveChangesAsync(CancellationToken ct = default);
}
