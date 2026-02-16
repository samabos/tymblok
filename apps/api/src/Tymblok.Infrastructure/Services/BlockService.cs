using Tymblok.Core.Entities;
using Tymblok.Core.Exceptions;
using Tymblok.Core.Interfaces;

namespace Tymblok.Infrastructure.Services;

public class BlockService : IBlockService
{
    private readonly IBlockRepository _repository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IAuditService _auditService;

    public BlockService(
        IBlockRepository repository,
        ICategoryRepository categoryRepository,
        IAuditService auditService)
    {
        _repository = repository;
        _categoryRepository = categoryRepository;
        _auditService = auditService;
    }

    public async Task<BlockWithCategory> CreateAsync(CreateBlockData data, Guid userId, CancellationToken ct = default)
    {
        // Validate category exists and user has access to it
        var category = await _categoryRepository.GetByIdWithUserAsync(data.CategoryId, userId);
        if (category == null)
        {
            throw new NotFoundException("CATEGORY_NOT_FOUND", "Category not found or not accessible");
        }

        // Calculate end time
        var endTime = data.StartTime.AddMinutes(data.DurationMinutes);

        // Get next sort order for this date
        var existingBlocks = await _repository.GetByDateAsync(userId, data.Date);
        var maxSortOrder = existingBlocks.Any() ? existingBlocks.Max(b => b.SortOrder) : 0;

        // Create entity
        var block = new TimeBlock
        {
            UserId = userId,
            CategoryId = data.CategoryId,
            Title = data.Title,
            Subtitle = data.Subtitle,
            Date = data.Date,
            StartTime = data.StartTime,
            EndTime = endTime,
            DurationMinutes = data.DurationMinutes,
            IsUrgent = data.IsUrgent,
            ExternalId = data.ExternalId,
            ExternalUrl = data.ExternalUrl,
            IsCompleted = false,
            Progress = 0,
            ElapsedSeconds = 0,
            SortOrder = maxSortOrder + 1
        };

        // Save via repository
        await _repository.CreateAsync(block);
        await _repository.SaveChangesAsync(ct);

        // Audit log (use anonymous object to avoid circular references)
        await _auditService.LogAsync(
            action: "Create",
            entityType: "TimeBlock",
            entityId: block.Id.ToString(),
            userId: userId,
            newValues: new
            {
                block.Id,
                block.Title,
                block.Subtitle,
                block.CategoryId,
                block.Date,
                block.StartTime,
                block.EndTime,
                block.DurationMinutes,
                block.IsUrgent
            });

        // Create a CategoryData record to avoid EF entity circular reference issues
        var categoryData = new CategoryData(
            category.Id,
            category.Name,
            category.Color,
            category.Icon,
            category.IsSystem,
            category.CreatedAt
        );

        // Return block with category data to avoid navigation property issues
        return new BlockWithCategory(block, categoryData);
    }

    public async Task<BlockWithCategory?> GetByIdAsync(Guid blockId, Guid userId, CancellationToken ct = default)
    {
        var block = await _repository.GetByIdWithUserAsync(blockId, userId);
        if (block == null) return null;

        // Load category separately
        var category = await _categoryRepository.GetByIdWithUserAsync(block.CategoryId, userId);
        if (category == null)
        {
            throw new NotFoundException("CATEGORY_NOT_FOUND", "Category not found for block");
        }

        // Create CategoryData to avoid EF entity circular references
        var categoryData = new CategoryData(
            category.Id,
            category.Name,
            category.Color,
            category.Icon,
            category.IsSystem,
            category.CreatedAt
        );

        return new BlockWithCategory(block, categoryData);
    }

    public async Task<IList<TimeBlock>> GetByDateRangeAsync(Guid userId, DateOnly startDate, DateOnly endDate, CancellationToken ct = default)
    {
        return await _repository.GetByDateRangeAsync(userId, startDate, endDate);
    }

    public async Task<IList<TimeBlock>> GetByDateAsync(Guid userId, DateOnly date, CancellationToken ct = default)
    {
        return await _repository.GetByDateAsync(userId, date);
    }

    public async Task<BlockWithCategory> UpdateAsync(Guid blockId, UpdateBlockData data, Guid userId, CancellationToken ct = default)
    {
        // Get block
        var block = await _repository.GetByIdAsync(blockId);
        if (block == null)
        {
            throw new NotFoundException("BLOCK_NOT_FOUND", "Time block not found");
        }

        // Check ownership
        if (block.UserId != userId)
        {
            throw new ForbiddenException("NOT_OWNER", "You do not have permission to update this time block");
        }

        // Validate category if changed
        if (data.CategoryId.HasValue && data.CategoryId.Value != block.CategoryId)
        {
            var newCategory = await _categoryRepository.GetByIdWithUserAsync(data.CategoryId.Value, userId);
            if (newCategory == null)
            {
                throw new NotFoundException("CATEGORY_NOT_FOUND", "Category not found or not accessible");
            }
        }

        // Store old values for audit
        var oldValues = new
        {
            block.Title,
            block.Subtitle,
            block.CategoryId,
            block.Date,
            block.StartTime,
            block.DurationMinutes,
            block.IsUrgent,
            block.IsCompleted,
            block.Progress
        };

        // Update properties
        block.Title = data.Title;
        block.Subtitle = data.Subtitle;

        if (data.CategoryId.HasValue)
        {
            block.CategoryId = data.CategoryId.Value;
        }

        if (data.Date.HasValue)
        {
            block.Date = data.Date.Value;
        }

        if (data.StartTime.HasValue)
        {
            block.StartTime = data.StartTime.Value;
        }

        if (data.DurationMinutes.HasValue)
        {
            block.DurationMinutes = data.DurationMinutes.Value;
        }

        // Recalculate end time if start time or duration changed
        if (data.StartTime.HasValue || data.DurationMinutes.HasValue)
        {
            block.EndTime = block.StartTime.AddMinutes(block.DurationMinutes);
        }

        if (data.IsUrgent.HasValue)
        {
            block.IsUrgent = data.IsUrgent.Value;
        }

        if (data.IsCompleted.HasValue)
        {
            block.IsCompleted = data.IsCompleted.Value;
            if (data.IsCompleted.Value && block.CompletedAt == null)
            {
                block.CompletedAt = DateTime.UtcNow;
                block.Progress = 100;
            }
            else if (!data.IsCompleted.Value)
            {
                block.CompletedAt = null;
            }
        }

        if (data.Progress.HasValue)
        {
            block.Progress = data.Progress.Value;
        }

        // Save changes
        _repository.Update(block);
        await _repository.SaveChangesAsync(ct);

        // Load category separately
        var category = await _categoryRepository.GetByIdWithUserAsync(block.CategoryId, userId);
        if (category == null)
        {
            throw new NotFoundException("CATEGORY_NOT_FOUND", "Category not found for block");
        }

        // Audit log
        await _auditService.LogAsync(
            action: "Update",
            entityType: "TimeBlock",
            entityId: block.Id.ToString(),
            userId: userId,
            oldValues: oldValues,
            newValues: new
            {
                block.Title,
                block.Subtitle,
                block.CategoryId,
                block.Date,
                block.StartTime,
                block.DurationMinutes,
                block.IsUrgent,
                block.IsCompleted,
                block.Progress
            });

        // Create CategoryData to avoid EF entity circular references
        var categoryData = new CategoryData(
            category.Id,
            category.Name,
            category.Color,
            category.Icon,
            category.IsSystem,
            category.CreatedAt
        );

        return new BlockWithCategory(block, categoryData);
    }

    public async Task<BlockWithCategory> CompleteAsync(Guid blockId, Guid userId, CancellationToken ct = default)
    {
        // Get block
        var block = await _repository.GetByIdAsync(blockId);
        if (block == null)
        {
            throw new NotFoundException("BLOCK_NOT_FOUND", "Time block not found");
        }

        // Check ownership
        if (block.UserId != userId)
        {
            throw new ForbiddenException("NOT_OWNER", "You do not have permission to complete this time block");
        }

        // Mark as completed
        block.IsCompleted = true;
        block.CompletedAt = DateTime.UtcNow;
        block.Progress = 100;

        // Save changes
        _repository.Update(block);
        await _repository.SaveChangesAsync(ct);

        // Load category separately
        var category = await _categoryRepository.GetByIdWithUserAsync(block.CategoryId, userId);
        if (category == null)
        {
            throw new NotFoundException("CATEGORY_NOT_FOUND", "Category not found for block");
        }

        // Audit log
        await _auditService.LogAsync(
            action: "Complete",
            entityType: "TimeBlock",
            entityId: block.Id.ToString(),
            userId: userId,
            newValues: new { block.IsCompleted, block.CompletedAt, block.Progress });

        // Create CategoryData to avoid EF entity circular references
        var categoryData = new CategoryData(
            category.Id,
            category.Name,
            category.Color,
            category.Icon,
            category.IsSystem,
            category.CreatedAt
        );

        return new BlockWithCategory(block, categoryData);
    }

    public async Task DeleteAsync(Guid blockId, Guid userId, CancellationToken ct = default)
    {
        // Get block
        var block = await _repository.GetByIdAsync(blockId);
        if (block == null)
        {
            throw new NotFoundException("BLOCK_NOT_FOUND", "Time block not found");
        }

        // Check ownership
        if (block.UserId != userId)
        {
            throw new ForbiddenException("NOT_OWNER", "You do not have permission to delete this time block");
        }

        // Store values for audit
        var deletedValues = new
        {
            block.Id,
            block.Title,
            block.Date,
            block.StartTime,
            block.EndTime,
            block.CategoryId
        };

        // Delete
        _repository.Delete(block);
        await _repository.SaveChangesAsync(ct);

        // Audit log
        await _auditService.LogAsync(
            action: "Delete",
            entityType: "TimeBlock",
            entityId: block.Id.ToString(),
            userId: userId,
            oldValues: deletedValues);
    }
}
