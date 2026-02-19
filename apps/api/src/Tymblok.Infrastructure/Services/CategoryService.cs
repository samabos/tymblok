using Tymblok.Core.Entities;
using Tymblok.Core.Exceptions;
using Tymblok.Core.Interfaces;

namespace Tymblok.Infrastructure.Services;

public class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _repository;
    private readonly IAuditService _auditService;

    public CategoryService(
        ICategoryRepository repository,
        IAuditService auditService)
    {
        _repository = repository;
        _auditService = auditService;
    }

    public async Task<Category> CreateAsync(CreateCategoryData data, Guid userId, CancellationToken ct = default)
    {
        // Create entity
        var category = new Category
        {
            UserId = userId,
            Name = data.Name,
            Color = data.Color,
            Icon = data.Icon,
            IsSystem = false
        };

        // Save via repository
        await _repository.CreateAsync(category);
        await _repository.SaveChangesAsync(ct);

        // Audit log
        await _auditService.LogAsync(
            action: "Create",
            entityType: "Category",
            entityId: category.Id.ToString(),
            userId: userId,
            newValues: category);

        return category;
    }

    public async Task<Category?> GetByIdAsync(Guid categoryId, Guid userId, CancellationToken ct = default)
    {
        return await _repository.GetByIdWithUserAsync(categoryId, userId);
    }

    public async Task<IList<Category>> GetAllAsync(Guid userId, CancellationToken ct = default)
    {
        return await _repository.GetByUserIdAsync(userId);
    }

    public async Task<Category> UpdateAsync(Guid categoryId, UpdateCategoryData data, Guid userId, CancellationToken ct = default)
    {
        // Get category
        var category = await _repository.GetByIdAsync(categoryId);
        if (category == null)
        {
            throw new NotFoundException("CATEGORY_NOT_FOUND", "Category not found");
        }

        // Check ownership (system categories can't be updated)
        if (category.IsSystem)
        {
            throw new ForbiddenException("SYSTEM_CATEGORY", "System categories cannot be modified");
        }

        if (category.UserId != userId)
        {
            throw new ForbiddenException("NOT_OWNER", "You do not have permission to update this category");
        }

        // Store old values for audit
        var oldValues = new
        {
            category.Name,
            category.Color,
            category.Icon
        };

        // Update properties
        category.Name = data.Name;
        category.Color = data.Color;
        category.Icon = data.Icon;

        // Save changes
        _repository.Update(category);
        await _repository.SaveChangesAsync(ct);

        // Audit log
        await _auditService.LogAsync(
            action: "Update",
            entityType: "Category",
            entityId: category.Id.ToString(),
            userId: userId,
            oldValues: oldValues,
            newValues: new { category.Name, category.Color, category.Icon });

        return category;
    }

    public async Task DeleteAsync(Guid categoryId, Guid userId, CancellationToken ct = default)
    {
        // Get category
        var category = await _repository.GetByIdAsync(categoryId);
        if (category == null)
        {
            throw new NotFoundException("CATEGORY_NOT_FOUND", "Category not found");
        }

        // Check ownership (system categories can't be deleted)
        if (category.IsSystem)
        {
            throw new ForbiddenException("SYSTEM_CATEGORY", "System categories cannot be deleted");
        }

        if (category.UserId != userId)
        {
            throw new ForbiddenException("NOT_OWNER", "You do not have permission to delete this category");
        }

        // Check if category is in use
        var isInUse = await _repository.IsInUseAsync(categoryId);
        if (isInUse)
        {
            throw new ConflictException("CATEGORY_IN_USE", "Cannot delete category that is being used by time blocks");
        }

        // Store values for audit
        var deletedValues = new
        {
            category.Id,
            category.Name,
            category.Color,
            category.Icon
        };

        // Delete
        _repository.Delete(category);
        await _repository.SaveChangesAsync(ct);

        // Audit log
        await _auditService.LogAsync(
            action: "Delete",
            entityType: "Category",
            entityId: category.Id.ToString(),
            userId: userId,
            oldValues: deletedValues);
    }
}
