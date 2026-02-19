using Tymblok.Core.Entities;
using Tymblok.Core.Exceptions;
using Tymblok.Core.Interfaces;

namespace Tymblok.Infrastructure.Services;

public class SupportContentService : ISupportContentService
{
    private readonly ISupportContentRepository _repository;
    private readonly IAuditService _auditService;

    public SupportContentService(
        ISupportContentRepository repository,
        IAuditService auditService)
    {
        _repository = repository;
        _auditService = auditService;
    }

    public async Task<SupportContent?> GetBySlugAsync(string slug, CancellationToken ct = default)
    {
        return await _repository.GetBySlugAsync(slug);
    }

    public async Task<IList<SupportContent>> GetAllPublishedAsync(CancellationToken ct = default)
    {
        return await _repository.GetAllPublishedAsync();
    }

    public async Task<IList<SupportContent>> GetAllAsync(CancellationToken ct = default)
    {
        return await _repository.GetAllAsync();
    }

    public async Task<SupportContent> CreateAsync(CreateSupportContentData data, CancellationToken ct = default)
    {
        var content = new SupportContent
        {
            Slug = data.Slug,
            Title = data.Title,
            Content = data.Content,
            ContentType = data.ContentType,
            IsPublished = true
        };

        await _repository.CreateAsync(content);
        await _repository.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "Create",
            entityType: "SupportContent",
            entityId: content.Id.ToString(),
            newValues: new { content.Slug, content.Title, content.ContentType });

        return content;
    }

    public async Task<SupportContent> UpdateAsync(Guid id, UpdateSupportContentData data, CancellationToken ct = default)
    {
        var content = await _repository.GetByIdAsync(id)
            ?? throw new NotFoundException("CONTENT_NOT_FOUND", "Support content not found");

        var oldValues = new { content.Title, content.Content, content.IsPublished, content.DisplayOrder };

        if (data.Title != null) content.Title = data.Title;
        if (data.Content != null) content.Content = data.Content;
        if (data.IsPublished.HasValue) content.IsPublished = data.IsPublished.Value;
        if (data.DisplayOrder.HasValue) content.DisplayOrder = data.DisplayOrder.Value;

        _repository.Update(content);
        await _repository.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "Update",
            entityType: "SupportContent",
            entityId: content.Id.ToString(),
            oldValues: oldValues,
            newValues: new { content.Title, content.Content, content.IsPublished, content.DisplayOrder });

        return content;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var content = await _repository.GetByIdAsync(id)
            ?? throw new NotFoundException("CONTENT_NOT_FOUND", "Support content not found");

        _repository.Delete(content);
        await _repository.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "Delete",
            entityType: "SupportContent",
            entityId: content.Id.ToString(),
            oldValues: new { content.Slug, content.Title });
    }
}
