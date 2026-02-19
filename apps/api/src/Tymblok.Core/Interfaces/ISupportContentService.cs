using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

public record CreateSupportContentData(string Slug, string Title, string Content, SupportContentType ContentType);
public record UpdateSupportContentData(string? Title = null, string? Content = null, bool? IsPublished = null, int? DisplayOrder = null);

public interface ISupportContentService
{
    Task<SupportContent?> GetBySlugAsync(string slug, CancellationToken ct = default);
    Task<IList<SupportContent>> GetAllPublishedAsync(CancellationToken ct = default);
    Task<IList<SupportContent>> GetAllAsync(CancellationToken ct = default);
    Task<SupportContent> CreateAsync(CreateSupportContentData data, CancellationToken ct = default);
    Task<SupportContent> UpdateAsync(Guid id, UpdateSupportContentData data, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
