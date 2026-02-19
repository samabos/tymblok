using Microsoft.EntityFrameworkCore;
using Tymblok.Core.Entities;
using Tymblok.Core.Exceptions;
using Tymblok.Core.Interfaces;
using Tymblok.Core.Services;
using Tymblok.Infrastructure.Data;

namespace Tymblok.Infrastructure.Services;

public class BlockService : IBlockService
{
    private readonly IBlockRepository _repository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IRecurrenceRuleRepository _recurrenceRuleRepository;
    private readonly IInboxRepository _inboxRepository;
    private readonly IRecurrenceService _recurrenceService;
    private readonly IAuditService _auditService;
    private readonly TymblokDbContext _context;

    // Default category GUID for inbox-generated blocks (Focus category)
    private static readonly Guid DefaultInboxCategoryId = Guid.Parse("00000000-0000-0000-0000-000000000004");

    public BlockService(
        IBlockRepository repository,
        ICategoryRepository categoryRepository,
        IRecurrenceRuleRepository recurrenceRuleRepository,
        IInboxRepository inboxRepository,
        IRecurrenceService recurrenceService,
        IAuditService auditService,
        TymblokDbContext context)
    {
        _repository = repository;
        _categoryRepository = categoryRepository;
        _recurrenceRuleRepository = recurrenceRuleRepository;
        _inboxRepository = inboxRepository;
        _recurrenceService = recurrenceService;
        _auditService = auditService;
        _context = context;
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

        // Create recurrence rule if needed
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

            await _recurrenceRuleRepository.CreateAsync(recurrenceRule);
            await _recurrenceRuleRepository.SaveChangesAsync(ct);
        }

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
            ExternalSource = data.ExternalSource,
            IsCompleted = false,
            Progress = 0,
            ElapsedSeconds = 0,
            SortOrder = maxSortOrder + 1,
            IsRecurring = data.IsRecurring,
            RecurrenceRuleId = recurrenceRule?.Id,
            RecurrenceParentId = null // This is the parent block
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
        // Get existing blocks
        var existingBlocks = await _repository.GetByDateRangeAsync(userId, startDate, endDate);

        // Get all recurring parent blocks for this user
        var recurringBlocks = await _repository.GetRecurringParentBlocksAsync(userId, ct);

        // Get all recurring inbox items for this user
        var recurringInboxItems = await _inboxRepository.GetRecurringInboxItemsAsync(userId, ct);

        // Generate missing occurrences
        var generatedBlocks = new List<TimeBlock>();

        // Generate from recurring time blocks
        foreach (var parentBlock in recurringBlocks)
        {
            if (parentBlock.RecurrenceRule == null) continue;

            // Generate occurrence dates within the range
            var occurrenceDates = _recurrenceService.GenerateOccurrences(
                parentBlock.RecurrenceRule,
                parentBlock.Date,
                startDate,
                endDate
            );

            foreach (var occurrenceDate in occurrenceDates)
            {
                // Skip if block already exists for this date and recurrence rule
                var alreadyExists = existingBlocks.Any(b =>
                        b.Date == occurrenceDate &&
                        b.RecurrenceRuleId == parentBlock.RecurrenceRuleId)
                    || generatedBlocks.Any(b =>
                        b.Date == occurrenceDate &&
                        b.RecurrenceRuleId == parentBlock.RecurrenceRuleId);

                if (alreadyExists) continue;

                // Create new occurrence
                var occurrence = CreateRecurrenceOccurrence(parentBlock, occurrenceDate);
                await _repository.CreateAsync(occurrence);
                generatedBlocks.Add(occurrence);
            }
        }

        // Generate from recurring inbox items
        foreach (var inboxItem in recurringInboxItems)
        {
            if (inboxItem.RecurrenceRule == null) continue;

            // For inbox items, use creation date as the effective start date
            var inboxStartDate = DateOnly.FromDateTime(inboxItem.CreatedAt);

            // Generate occurrence dates within the range
            var occurrenceDates = _recurrenceService.GenerateOccurrences(
                inboxItem.RecurrenceRule,
                inboxStartDate,
                startDate,
                endDate
            );

            foreach (var occurrenceDate in occurrenceDates)
            {
                // Skip if block already exists for this date and recurrence rule
                var alreadyExists = existingBlocks.Any(b =>
                        b.Date == occurrenceDate &&
                        b.RecurrenceRuleId == inboxItem.RecurrenceRuleId)
                    || generatedBlocks.Any(b =>
                        b.Date == occurrenceDate &&
                        b.RecurrenceRuleId == inboxItem.RecurrenceRuleId);

                if (alreadyExists) continue;

                // Skip if a block with the same title already exists for this date
                // (prevents cross-source duplicates from TimeBlocks and InboxItems)
                var titleExists = existingBlocks.Any(b =>
                        b.Date == occurrenceDate &&
                        b.Title == inboxItem.Title)
                    || generatedBlocks.Any(b =>
                        b.Date == occurrenceDate &&
                        b.Title == inboxItem.Title);

                if (titleExists) continue;

                // Create new occurrence from inbox item
                var occurrence = await CreateBlockFromInboxItemAsync(inboxItem, occurrenceDate, userId);
                await _repository.CreateAsync(occurrence);
                generatedBlocks.Add(occurrence);
            }
        }

        // Save generated blocks if any
        if (generatedBlocks.Any())
        {
            await _repository.SaveChangesAsync(ct);
        }

        // Combine, deduplicate, and return all blocks.
        // Dedup by RecurrenceRuleId for recurring blocks to handle duplicates
        // already persisted in the database from prior bugs or race conditions.
        return existingBlocks
            .Concat(generatedBlocks)
            .GroupBy(b => b.RecurrenceRuleId != null
                ? $"rule:{b.RecurrenceRuleId}:{b.Date}"
                : $"id:{b.Id}")
            .Select(g => g.First())
            .OrderBy(b => b.Date)
            .ThenBy(b => b.StartTime)
            .ThenBy(b => b.SortOrder)
            .ToList();
    }

    public async Task<IList<TimeBlock>> GetByDateAsync(Guid userId, DateOnly date, CancellationToken ct = default)
    {
        // Get existing blocks
        var existingBlocks = await _repository.GetByDateAsync(userId, date);

        // Get all recurring parent blocks for this user
        var recurringBlocks = await _repository.GetRecurringParentBlocksAsync(userId, ct);

        // Get all recurring inbox items for this user
        var recurringInboxItems = await _inboxRepository.GetRecurringInboxItemsAsync(userId, ct);

        // Generate missing occurrences for this date
        var generatedBlocks = new List<TimeBlock>();

        // Generate from recurring time blocks
        foreach (var parentBlock in recurringBlocks)
        {
            if (parentBlock.RecurrenceRule == null) continue;

            // Check if this date should have an occurrence
            var shouldOccur = _recurrenceService.IsOccurrenceDate(
                parentBlock.RecurrenceRule,
                parentBlock.Date,
                date
            );

            if (!shouldOccur) continue;

            // Skip if block already exists for this date and recurrence rule
            var alreadyExists = existingBlocks.Any(b =>
                    b.Date == date &&
                    b.RecurrenceRuleId == parentBlock.RecurrenceRuleId)
                || generatedBlocks.Any(b =>
                    b.Date == date &&
                    b.RecurrenceRuleId == parentBlock.RecurrenceRuleId);

            if (alreadyExists) continue;

            // Create new occurrence
            var occurrence = CreateRecurrenceOccurrence(parentBlock, date);
            await _repository.CreateAsync(occurrence);
            generatedBlocks.Add(occurrence);
        }

        // Generate from recurring inbox items
        foreach (var inboxItem in recurringInboxItems)
        {
            if (inboxItem.RecurrenceRule == null) continue;

            // For inbox items, we need a start date - use today as the effective start date
            var inboxStartDate = DateOnly.FromDateTime(inboxItem.CreatedAt);

            // Check if this date should have an occurrence
            var shouldOccur = _recurrenceService.IsOccurrenceDate(
                inboxItem.RecurrenceRule,
                inboxStartDate,
                date
            );

            if (!shouldOccur) continue;

            // Skip if block already exists for this date and recurrence rule
            var alreadyExists = existingBlocks.Any(b =>
                    b.Date == date &&
                    b.RecurrenceRuleId == inboxItem.RecurrenceRuleId)
                || generatedBlocks.Any(b =>
                    b.Date == date &&
                    b.RecurrenceRuleId == inboxItem.RecurrenceRuleId);

            if (alreadyExists) continue;

            // Skip if a block with the same title already exists for this date
            // (prevents cross-source duplicates from TimeBlocks and InboxItems)
            var titleExists = existingBlocks.Any(b =>
                    b.Date == date &&
                    b.Title == inboxItem.Title)
                || generatedBlocks.Any(b =>
                    b.Date == date &&
                    b.Title == inboxItem.Title);

            if (titleExists) continue;

            // Create new occurrence from inbox item
            var occurrence = await CreateBlockFromInboxItemAsync(inboxItem, date, userId);
            await _repository.CreateAsync(occurrence);
            generatedBlocks.Add(occurrence);
        }

        // Save generated blocks if any
        if (generatedBlocks.Any())
        {
            await _repository.SaveChangesAsync(ct);
        }

        // Combine, deduplicate, and return all blocks.
        // Dedup by RecurrenceRuleId for recurring blocks to handle duplicates
        // already persisted in the database from prior bugs or race conditions.
        return existingBlocks
            .Concat(generatedBlocks)
            .GroupBy(b => b.RecurrenceRuleId != null
                ? $"rule:{b.RecurrenceRuleId}:{b.Date}"
                : $"id:{b.Id}")
            .Select(g => g.First())
            .OrderBy(b => b.StartTime)
            .ThenBy(b => b.SortOrder)
            .ToList();
    }

    private TimeBlock CreateRecurrenceOccurrence(TimeBlock parentBlock, DateOnly occurrenceDate)
    {
        return new TimeBlock
        {
            UserId = parentBlock.UserId,
            CategoryId = parentBlock.CategoryId,
            Category = parentBlock.Category,
            Title = parentBlock.Title,
            Subtitle = parentBlock.Subtitle,
            Date = occurrenceDate,
            StartTime = parentBlock.StartTime,
            EndTime = parentBlock.EndTime,
            DurationMinutes = parentBlock.DurationMinutes,
            IsUrgent = parentBlock.IsUrgent,
            ExternalId = parentBlock.ExternalId,
            ExternalUrl = parentBlock.ExternalUrl,
            IsCompleted = false,
            Progress = 0,
            ElapsedSeconds = 0,
            SortOrder = 0, // Will be ordered by query
            IsRecurring = true,
            RecurrenceRuleId = parentBlock.RecurrenceRuleId,
            RecurrenceParentId = parentBlock.Id
        };
    }

    private async Task<TimeBlock> CreateBlockFromInboxItemAsync(InboxItem inboxItem, DateOnly occurrenceDate, Guid userId)
    {
        // Use default category (Focus) for inbox-generated blocks
        var categoryId = DefaultInboxCategoryId;

        // Check if user has access to this category, otherwise use first available category
        var category = await _categoryRepository.GetByIdAsync(categoryId);
        if (category == null || (category.UserId.HasValue && category.UserId != userId))
        {
            // Fallback to first system category
            var systemCategories = await _categoryRepository.GetSystemCategoriesAsync();
            category = systemCategories.FirstOrDefault();
            if (category != null)
            {
                categoryId = category.Id;
            }
        }

        // Default time and duration for inbox-generated blocks
        var startTime = new TimeOnly(9, 0); // 9:00 AM
        var durationMinutes = 30; // 30 minutes default
        var endTime = startTime.AddMinutes(durationMinutes);

        return new TimeBlock
        {
            UserId = userId,
            CategoryId = categoryId,
            Title = inboxItem.Title,
            Subtitle = inboxItem.Description,
            Date = occurrenceDate,
            StartTime = startTime,
            EndTime = endTime,
            DurationMinutes = durationMinutes,
            IsUrgent = inboxItem.Priority == InboxPriority.Critical || inboxItem.Priority == InboxPriority.High,
            ExternalId = inboxItem.ExternalId,
            ExternalUrl = inboxItem.ExternalUrl,
            IsCompleted = false,
            Progress = 0,
            ElapsedSeconds = 0,
            SortOrder = 0,
            IsRecurring = false, // Generated blocks are not recurring parents
            RecurrenceRuleId = inboxItem.RecurrenceRuleId, // Track which rule generated this
            RecurrenceParentId = null // No parent block (generated from inbox item)
        };
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
        if (data.Title != null)
        {
            block.Title = data.Title;
        }

        if (data.Subtitle != null)
        {
            block.Subtitle = data.Subtitle;
        }

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

        if (data.SortOrder.HasValue)
        {
            block.SortOrder = data.SortOrder.Value;
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

        // Soft delete
        block.IsDeleted = true;
        block.DeletedAt = DateTime.UtcNow;
        block.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync(ct);

        // Audit log
        await _auditService.LogAsync(
            action: "Delete",
            entityType: "TimeBlock",
            entityId: block.Id.ToString(),
            userId: userId,
            oldValues: deletedValues);
    }

    public async Task<BlockWithCategory> RestoreAsync(Guid blockId, Guid userId, CancellationToken ct = default)
    {
        // Get block (need to query deleted blocks)
        var block = await _context.TimeBlocks
            .Include(b => b.Category)
            .IgnoreQueryFilters() // This allows us to see soft-deleted blocks
            .FirstOrDefaultAsync(b => b.Id == blockId, ct);

        if (block == null)
        {
            throw new NotFoundException("BLOCK_NOT_FOUND", "Time block not found");
        }

        // Check ownership
        if (block.UserId != userId)
        {
            throw new ForbiddenException("NOT_OWNER", "You do not have permission to restore this time block");
        }

        // Check if actually deleted
        if (!block.IsDeleted)
        {
            throw new ValidationException("BLOCK_NOT_DELETED", "Time block is not deleted");
        }

        // Restore
        block.IsDeleted = false;
        block.DeletedAt = null;
        block.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync(ct);

        // Audit log
        await _auditService.LogAsync(
            action: "Restore",
            entityType: "TimeBlock",
            entityId: block.Id.ToString(),
            userId: userId,
            newValues: new { IsDeleted = false });

        // Get category data
        var categoryData = new CategoryData(
            block.Category.Id,
            block.Category.Name,
            block.Category.Color,
            block.Category.Icon,
            block.Category.IsSystem,
            block.Category.CreatedAt
        );

        return new BlockWithCategory(block, categoryData);
    }

    public async Task<BlockWithCategory> StartAsync(Guid blockId, Guid userId, CancellationToken ct = default)
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
            throw new ForbiddenException("NOT_OWNER", "You do not have permission to start this time block");
        }

        // Check if block is already running
        if (block.TimerState == TimerState.Running)
        {
            // Already running, just return current state
            var categoryForRunning = await _categoryRepository.GetByIdWithUserAsync(block.CategoryId, userId);
            if (categoryForRunning == null)
            {
                throw new NotFoundException("CATEGORY_NOT_FOUND", "Category not found for block");
            }

            var categoryDataForRunning = new CategoryData(
                categoryForRunning.Id,
                categoryForRunning.Name,
                categoryForRunning.Color,
                categoryForRunning.Icon,
                categoryForRunning.IsSystem,
                categoryForRunning.CreatedAt
            );

            return new BlockWithCategory(block, categoryDataForRunning);
        }

        // Check if block is completed
        if (block.TimerState == TimerState.Completed || block.IsCompleted)
        {
            throw new ValidationException("BLOCK_COMPLETED", "Cannot start a completed block");
        }

        // Start the timer
        block.TimerState = TimerState.Running;
        block.StartedAt ??= DateTime.UtcNow; // Set only on first start
        block.ResumedAt = DateTime.UtcNow;
        block.PausedAt = null;

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
            action: "Start",
            entityType: "TimeBlock",
            entityId: block.Id.ToString(),
            userId: userId,
            newValues: new { block.TimerState, block.StartedAt, block.ResumedAt });

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

    public async Task<BlockWithCategory> PauseAsync(Guid blockId, Guid userId, CancellationToken ct = default)
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
            throw new ForbiddenException("NOT_OWNER", "You do not have permission to pause this time block");
        }

        // Check if block is running
        if (block.TimerState != TimerState.Running)
        {
            throw new ValidationException("BLOCK_NOT_RUNNING", "Block is not running");
        }

        // Calculate elapsed time since last resume/start
        var runDuration = (DateTime.UtcNow - (block.ResumedAt ?? block.StartedAt!.Value)).TotalSeconds;
        block.ElapsedSeconds += (int)runDuration;

        // Pause the timer
        block.TimerState = TimerState.Paused;
        block.PausedAt = DateTime.UtcNow;
        block.ResumedAt = null;

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
            action: "Pause",
            entityType: "TimeBlock",
            entityId: block.Id.ToString(),
            userId: userId,
            newValues: new { block.TimerState, block.PausedAt, block.ElapsedSeconds });

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

    public async Task<IList<TimeBlock>> CarryOverAsync(Guid userId, CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // 1. Get uncompleted past blocks (non-recurring, non-deleted via EF filter)
        var pastBlocks = await _repository.GetUncompletedPastBlocksAsync(userId, today, ct);
        if (pastBlocks.Count == 0) return Array.Empty<TimeBlock>();

        // 2. Get today's existing blocks to determine max SortOrder
        var todayBlocks = await _repository.GetByDateAsync(userId, today);
        var maxSortOrder = todayBlocks.Any() ? todayBlocks.Max(b => b.SortOrder) : 0;

        // 3. Move each past block to today
        foreach (var block in pastBlocks)
        {
            var oldDate = block.Date;

            // If timer was running, accumulate elapsed time before resetting
            if (block.TimerState == TimerState.Running && block.ResumedAt.HasValue)
            {
                var runDuration = (DateTime.UtcNow - block.ResumedAt.Value).TotalSeconds;
                block.ElapsedSeconds += (int)runDuration;
            }

            // Move to today
            block.Date = today;

            // Reset timer state but preserve elapsed seconds (partial work kept)
            block.TimerState = TimerState.NotStarted;
            block.StartedAt = null;
            block.PausedAt = null;
            block.ResumedAt = null;

            // Place after today's existing blocks
            maxSortOrder++;
            block.SortOrder = maxSortOrder;

            _repository.Update(block);

            // Audit log
            await _auditService.LogAsync(
                action: "CarryOver",
                entityType: "TimeBlock",
                entityId: block.Id.ToString(),
                userId: userId,
                oldValues: new { Date = oldDate },
                newValues: new { Date = today });
        }

        // 4. Batch save
        await _repository.SaveChangesAsync(ct);

        return pastBlocks;
    }
}
