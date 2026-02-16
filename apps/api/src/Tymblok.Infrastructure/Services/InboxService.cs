using Tymblok.Core.Entities;
using Tymblok.Core.Exceptions;
using Tymblok.Core.Interfaces;

namespace Tymblok.Infrastructure.Services;

public class InboxService : IInboxService
{
    private readonly IInboxRepository _repository;
    private readonly IRecurrenceRuleRepository _recurrenceRepository;
    private readonly IBlockRepository _blockRepository;
    private readonly IAuditService _auditService;

    public InboxService(
        IInboxRepository repository,
        IRecurrenceRuleRepository recurrenceRepository,
        IBlockRepository blockRepository,
        IAuditService auditService)
    {
        _repository = repository;
        _recurrenceRepository = recurrenceRepository;
        _blockRepository = blockRepository;
        _auditService = auditService;
    }

    public async Task<InboxItem> CreateAsync(CreateInboxItemData data, Guid userId, CancellationToken ct = default)
    {
        // Create recurrence rule if recurring
        RecurrenceRule? recurrenceRule = null;
        if (data.IsRecurring && data.RecurrenceType.HasValue)
        {
            recurrenceRule = new RecurrenceRule
            {
                Type = data.RecurrenceType.Value,
                Interval = data.RecurrenceInterval,
                DaysOfWeek = data.RecurrenceDaysOfWeek,
                EndDate = data.RecurrenceEndDate,
                MaxOccurrences = data.RecurrenceMaxOccurrences
            };

            await _recurrenceRepository.CreateAsync(recurrenceRule);
        }

        // Create entity
        var item = new InboxItem
        {
            UserId = userId,
            Title = data.Title,
            Description = data.Description,
            Priority = data.Priority,
            IntegrationId = data.IntegrationId,
            ExternalId = data.ExternalId,
            ExternalUrl = data.ExternalUrl,
            Source = InboxSource.Manual, // Default to Manual for user-created items
            Type = InboxItemType.Task,   // Default to Task
            IsDismissed = false,
            IsScheduled = false,
            IsRecurring = data.IsRecurring,
            RecurrenceRuleId = recurrenceRule?.Id
        };

        // Save via repository
        await _repository.CreateAsync(item);
        await _repository.SaveChangesAsync(ct);

        // Audit log
        await _auditService.LogAsync(
            action: "Create",
            entityType: "InboxItem",
            entityId: item.Id.ToString(),
            userId: userId,
            newValues: item);

        return item;
    }

    public async Task<InboxItem?> GetByIdAsync(Guid itemId, Guid userId, CancellationToken ct = default)
    {
        return await _repository.GetByIdWithUserAsync(itemId, userId);
    }

    public async Task<IList<InboxItem>> GetAllAsync(Guid userId, InboxItemFilters? filters = null, CancellationToken ct = default)
    {
        return await _repository.GetByUserIdAsync(
            userId,
            filters?.IsDismissed,
            filters?.Source,
            filters?.Priority);
    }

    public async Task<InboxItem> UpdateAsync(Guid itemId, UpdateInboxItemData data, Guid userId, CancellationToken ct = default)
    {
        // Get item
        var item = await _repository.GetByIdAsync(itemId);
        if (item == null)
        {
            throw new NotFoundException("INBOX_ITEM_NOT_FOUND", "Inbox item not found");
        }

        // Check ownership
        if (item.UserId != userId)
        {
            throw new ForbiddenException("NOT_OWNER", "You do not have permission to update this inbox item");
        }

        // Store old values for audit
        var oldValues = new
        {
            item.Title,
            item.Description,
            item.Priority,
            item.IsDismissed
        };

        // Update properties
        item.Title = data.Title;
        item.Description = data.Description;

        if (data.Priority.HasValue)
        {
            item.Priority = data.Priority.Value;
        }

        if (data.IsDismissed.HasValue)
        {
            item.IsDismissed = data.IsDismissed.Value;
            if (data.IsDismissed.Value && item.DismissedAt == null)
            {
                item.DismissedAt = DateTime.UtcNow;
            }
            else if (!data.IsDismissed.Value)
            {
                item.DismissedAt = null;
            }
        }

        // Save changes
        _repository.Update(item);
        await _repository.SaveChangesAsync(ct);

        // Audit log
        await _auditService.LogAsync(
            action: "Update",
            entityType: "InboxItem",
            entityId: item.Id.ToString(),
            userId: userId,
            oldValues: oldValues,
            newValues: new { item.Title, item.Description, item.Priority, item.IsDismissed });

        return item;
    }

    public async Task<InboxItem> DismissAsync(Guid itemId, Guid userId, CancellationToken ct = default)
    {
        // Get item
        var item = await _repository.GetByIdAsync(itemId);
        if (item == null)
        {
            throw new NotFoundException("INBOX_ITEM_NOT_FOUND", "Inbox item not found");
        }

        // Check ownership
        if (item.UserId != userId)
        {
            throw new ForbiddenException("NOT_OWNER", "You do not have permission to dismiss this inbox item");
        }

        // Mark as dismissed
        item.IsDismissed = true;
        item.DismissedAt = DateTime.UtcNow;

        // Save changes
        _repository.Update(item);
        await _repository.SaveChangesAsync(ct);

        // Audit log
        await _auditService.LogAsync(
            action: "Dismiss",
            entityType: "InboxItem",
            entityId: item.Id.ToString(),
            userId: userId,
            newValues: new { item.IsDismissed, item.DismissedAt });

        return item;
    }

    public async Task DeleteAsync(Guid itemId, Guid userId, CancellationToken ct = default)
    {
        // Get item
        var item = await _repository.GetByIdAsync(itemId);
        if (item == null)
        {
            throw new NotFoundException("INBOX_ITEM_NOT_FOUND", "Inbox item not found");
        }

        // Check ownership
        if (item.UserId != userId)
        {
            throw new ForbiddenException("NOT_OWNER", "You do not have permission to delete this inbox item");
        }

        // If recurring, delete all future blocks associated with this recurrence rule
        if (item.IsRecurring && item.RecurrenceRuleId.HasValue)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var futureBlocks = await _blockRepository.GetByRecurrenceRuleAsync(
                item.RecurrenceRuleId.Value,
                userId,
                ct);

            // Only delete future blocks (not past or completed ones)
            var blocksToDelete = futureBlocks
                .Where(b => b.Date >= today && !b.IsCompleted)
                .ToList();

            foreach (var block in blocksToDelete)
            {
                // Soft delete
                block.IsDeleted = true;
                block.DeletedAt = DateTime.UtcNow;
                block.UpdatedAt = DateTime.UtcNow;
            }

            // Audit log for deleted blocks
            if (blocksToDelete.Any())
            {
                await _auditService.LogAsync(
                    action: "DeleteFutureBlocks",
                    entityType: "TimeBlock",
                    entityId: item.RecurrenceRuleId.Value.ToString(),
                    userId: userId,
                    oldValues: new { DeletedCount = blocksToDelete.Count, InboxItemId = itemId });
            }
        }

        // Store values for audit
        var deletedValues = new
        {
            item.Id,
            item.Title,
            item.Description,
            item.Source,
            item.Priority,
            item.IsRecurring,
            item.RecurrenceRuleId
        };

        // Delete inbox item
        _repository.Delete(item);
        await _repository.SaveChangesAsync(ct);

        // Audit log
        await _auditService.LogAsync(
            action: "Delete",
            entityType: "InboxItem",
            entityId: item.Id.ToString(),
            userId: userId,
            oldValues: deletedValues);
    }
}
