using Microsoft.EntityFrameworkCore;
using Tymblok.Core.Entities;
using Tymblok.Core.Interfaces;
using Tymblok.Core.Services;
using Tymblok.Infrastructure.Data;
using Tymblok.Infrastructure.Repositories;
using Tymblok.Infrastructure.Services;

namespace Tymblok.Infrastructure.Tests.Services;

public class InboxRecurrenceTests : IDisposable
{
    private readonly TymblokDbContext _context;
    private readonly BlockService _blockService;
    private readonly InboxService _inboxService;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _categoryId = Guid.Parse("00000000-0000-0000-0000-000000000004"); // Focus category

    public InboxRecurrenceTests()
    {
        var options = new DbContextOptionsBuilder<TymblokDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new TymblokDbContext(options);

        // Seed Focus category (system category for inbox-generated blocks)
        var category = new Category
        {
            Id = _categoryId,
            Name = "Focus",
            Color = "#f59e0b",
            Icon = "zap",
            IsSystem = true
        };
        _context.Categories.Add(category);
        _context.SaveChanges();

        // Setup services
        var blockRepo = new BlockRepository(_context);
        var categoryRepo = new CategoryRepository(_context);
        var recurrenceRuleRepo = new RecurrenceRuleRepository(_context);
        var inboxRepo = new InboxRepository(_context);
        var recurrenceService = new RecurrenceService();
        var auditService = new FakeAuditService();

        _blockService = new BlockService(
            blockRepo,
            categoryRepo,
            recurrenceRuleRepo,
            inboxRepo,
            recurrenceService,
            auditService,
            _context
        );

        _inboxService = new InboxService(
            inboxRepo,
            recurrenceRuleRepo,
            blockRepo,
            auditService
        );
    }

    [Fact]
    public async Task GetByDateAsync_WithDailyRecurringInboxItem_GeneratesBlock()
    {
        // Arrange - Create a daily recurring inbox item
        var createData = new CreateInboxItemData(
            Title: "Daily Standup",
            Description: "Team sync",
            Priority: InboxPriority.High,
            IntegrationId: null,
            ExternalId: null,
            ExternalUrl: null,
            IsRecurring: true,
            RecurrenceType: RecurrenceType.Daily,
            RecurrenceInterval: 1,
            RecurrenceDaysOfWeek: null,
            RecurrenceEndDate: null,
            RecurrenceMaxOccurrences: null
        );

        await _inboxService.CreateAsync(createData, _userId);

        // Act - Query for today's blocks
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var blocks = await _blockService.GetByDateAsync(_userId, today);

        // Assert
        Assert.Single(blocks);
        var block = blocks.First();
        Assert.Equal("Daily Standup", block.Title);
        Assert.Equal("Team sync", block.Subtitle);
        Assert.Equal(today, block.Date);
        Assert.Equal(new TimeOnly(9, 0), block.StartTime); // Default 9:00 AM
        Assert.Equal(30, block.DurationMinutes); // Default 30 minutes
        Assert.Equal(_categoryId, block.CategoryId); // Default Focus category
        Assert.True(block.IsUrgent); // High priority = urgent
        Assert.False(block.IsRecurring); // Generated blocks are not recurring parents
        Assert.NotNull(block.RecurrenceRuleId); // But they track the rule that generated them
    }

    [Fact]
    public async Task GetByDateAsync_RecurringInboxItem_DoesNotCreateDuplicates()
    {
        // Arrange - Create a daily recurring inbox item
        var createData = new CreateInboxItemData(
            Title: "Daily Standup",
            Description: null,
            Priority: InboxPriority.Medium,
            IntegrationId: null,
            ExternalId: null,
            ExternalUrl: null,
            IsRecurring: true,
            RecurrenceType: RecurrenceType.Daily,
            RecurrenceInterval: 1
        );

        await _inboxService.CreateAsync(createData, _userId);

        // Act - Query same date twice
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        await _blockService.GetByDateAsync(_userId, today);
        var blocksSecondQuery = await _blockService.GetByDateAsync(_userId, today);

        // Assert - Should still only have one block
        Assert.Single(blocksSecondQuery);
    }

    [Fact]
    public async Task GetByDateAsync_WeeklyRecurringInboxItem_GeneratesOnCorrectDay()
    {
        // Arrange - Create a weekly recurring inbox item for Monday
        var createData = new CreateInboxItemData(
            Title: "Weekly Planning",
            Description: null,
            Priority: InboxPriority.Medium,
            IntegrationId: null,
            ExternalId: null,
            ExternalUrl: null,
            IsRecurring: true,
            RecurrenceType: RecurrenceType.Weekly,
            RecurrenceInterval: 1,
            RecurrenceDaysOfWeek: "1" // Monday
        );

        await _inboxService.CreateAsync(createData, _userId);

        // Act - Query for a Monday (2026-02-16)
        var monday = new DateOnly(2026, 2, 16);
        var blocksOnMonday = await _blockService.GetByDateAsync(_userId, monday);

        // Query for Tuesday (should not generate)
        var tuesday = new DateOnly(2026, 2, 17);
        var blocksOnTuesday = await _blockService.GetByDateAsync(_userId, tuesday);

        // Assert
        Assert.Single(blocksOnMonday);
        Assert.Empty(blocksOnTuesday);
    }

    [Fact]
    public async Task GetByDateAsync_InboxItemWithEndDate_StopsGeneratingAfterEndDate()
    {
        // Arrange - Create recurring inbox item ending Feb 18
        var createData = new CreateInboxItemData(
            Title: "Limited Task",
            Description: null,
            Priority: InboxPriority.Medium,
            IntegrationId: null,
            ExternalId: null,
            ExternalUrl: null,
            IsRecurring: true,
            RecurrenceType: RecurrenceType.Daily,
            RecurrenceInterval: 1,
            RecurrenceEndDate: new DateOnly(2026, 2, 18)
        );

        await _inboxService.CreateAsync(createData, _userId);

        // Act - Query for Feb 18 (should generate)
        var lastDay = new DateOnly(2026, 2, 18);
        var blocksOnLastDay = await _blockService.GetByDateAsync(_userId, lastDay);

        // Query for Feb 19 (after end date, should not generate)
        var afterEndDate = new DateOnly(2026, 2, 19);
        var blocksAfterEnd = await _blockService.GetByDateAsync(_userId, afterEndDate);

        // Assert
        Assert.Single(blocksOnLastDay);
        Assert.Empty(blocksAfterEnd);
    }

    [Fact]
    public async Task GetByDateAsync_DismissedRecurringInboxItem_DoesNotGenerateBlocks()
    {
        // Arrange - Create and then dismiss a recurring inbox item
        var createData = new CreateInboxItemData(
            Title: "Daily Task",
            Description: null,
            Priority: InboxPriority.Medium,
            IntegrationId: null,
            ExternalId: null,
            ExternalUrl: null,
            IsRecurring: true,
            RecurrenceType: RecurrenceType.Daily,
            RecurrenceInterval: 1
        );

        var inboxItem = await _inboxService.CreateAsync(createData, _userId);

        // Dismiss the inbox item
        await _inboxService.DismissAsync(inboxItem.Id, _userId);

        // Act - Query for today's blocks
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var blocks = await _blockService.GetByDateAsync(_userId, today);

        // Assert - Should not generate block from dismissed inbox item
        Assert.Empty(blocks);
    }

    [Fact]
    public async Task GetByDateRangeAsync_RecurringInboxItem_GeneratesMultipleBlocks()
    {
        // Arrange - Create a daily recurring inbox item
        var createData = new CreateInboxItemData(
            Title: "Daily Standup",
            Description: null,
            Priority: InboxPriority.Medium,
            IntegrationId: null,
            ExternalId: null,
            ExternalUrl: null,
            IsRecurring: true,
            RecurrenceType: RecurrenceType.Daily,
            RecurrenceInterval: 1
        );

        await _inboxService.CreateAsync(createData, _userId);

        // Act - Query for a week range
        var startDate = new DateOnly(2026, 2, 16);
        var endDate = new DateOnly(2026, 2, 22);
        var blocks = await _blockService.GetByDateRangeAsync(_userId, startDate, endDate);

        // Assert - Should have 7 blocks (one for each day)
        Assert.Equal(7, blocks.Count);
        Assert.All(blocks, b => Assert.Equal("Daily Standup", b.Title));
    }

    [Fact]
    public async Task DeleteInboxItem_RecurringWithFutureBlocks_DeletesFutureBlocks()
    {
        // Arrange - Create recurring inbox item and generate blocks
        var createData = new CreateInboxItemData(
            Title: "Daily Task",
            Description: null,
            Priority: InboxPriority.Medium,
            IntegrationId: null,
            ExternalId: null,
            ExternalUrl: null,
            IsRecurring: true,
            RecurrenceType: RecurrenceType.Daily,
            RecurrenceInterval: 1
        );

        var inboxItem = await _inboxService.CreateAsync(createData, _userId);

        // Generate blocks for next 5 days
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        for (int i = 0; i < 5; i++)
        {
            await _blockService.GetByDateAsync(_userId, today.AddDays(i));
        }

        // Verify blocks exist
        var blocksBeforeDelete = await _blockService.GetByDateRangeAsync(
            _userId, today, today.AddDays(4));
        Assert.Equal(5, blocksBeforeDelete.Count);

        // Act - Delete the inbox item
        await _inboxService.DeleteAsync(inboxItem.Id, _userId);

        // Assert - Future blocks should be deleted
        var blocksAfterDelete = await _blockService.GetByDateRangeAsync(
            _userId, today, today.AddDays(4));
        Assert.Empty(blocksAfterDelete);
    }

    [Fact]
    public async Task DeleteInboxItem_RecurringWithCompletedBlocks_PreservesCompletedBlocks()
    {
        // Arrange - Create recurring inbox item
        var createData = new CreateInboxItemData(
            Title: "Daily Task",
            Description: null,
            Priority: InboxPriority.Medium,
            IntegrationId: null,
            ExternalId: null,
            ExternalUrl: null,
            IsRecurring: true,
            RecurrenceType: RecurrenceType.Daily,
            RecurrenceInterval: 1
        );

        var inboxItem = await _inboxService.CreateAsync(createData, _userId);

        // Generate blocks for today, tomorrow, and day after
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var tomorrow = today.AddDays(1);
        var dayAfter = today.AddDays(2);

        var blocksToday = await _blockService.GetByDateAsync(_userId, today);
        await _blockService.GetByDateAsync(_userId, tomorrow);
        await _blockService.GetByDateAsync(_userId, dayAfter);

        // Complete today's block
        var todayBlock = blocksToday.First();
        await _blockService.CompleteAsync(todayBlock.Id, _userId);

        // Act - Delete the inbox item
        await _inboxService.DeleteAsync(inboxItem.Id, _userId);

        // Assert - Today's completed block should still exist (completed blocks are preserved)
        var blocksAfterDeleteToday = await _blockService.GetByDateAsync(_userId, today);
        Assert.Single(blocksAfterDeleteToday);
        Assert.True(blocksAfterDeleteToday.First().IsCompleted);

        // Future incomplete blocks should be deleted
        var tomorrowBlocksAfterDelete = await _blockService.GetByDateAsync(_userId, tomorrow);
        var dayAfterBlocksAfterDelete = await _blockService.GetByDateAsync(_userId, dayAfter);
        Assert.Empty(tomorrowBlocksAfterDelete);
        Assert.Empty(dayAfterBlocksAfterDelete);
    }

    [Fact]
    public async Task RecurringInboxItem_LowPriority_CreatesNonUrgentBlock()
    {
        // Arrange - Create a low priority recurring inbox item
        var createData = new CreateInboxItemData(
            Title: "Low Priority Task",
            Description: null,
            Priority: InboxPriority.Low,
            IntegrationId: null,
            ExternalId: null,
            ExternalUrl: null,
            IsRecurring: true,
            RecurrenceType: RecurrenceType.Daily,
            RecurrenceInterval: 1
        );

        await _inboxService.CreateAsync(createData, _userId);

        // Act
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var blocks = await _blockService.GetByDateAsync(_userId, today);

        // Assert - Should not be urgent (only High/Critical = urgent)
        Assert.Single(blocks);
        Assert.False(blocks.First().IsUrgent);
    }

    [Fact]
    public async Task RecurringInboxItem_CriticalPriority_CreatesUrgentBlock()
    {
        // Arrange - Create a critical priority recurring inbox item
        var createData = new CreateInboxItemData(
            Title: "Critical Task",
            Description: null,
            Priority: InboxPriority.Critical,
            IntegrationId: null,
            ExternalId: null,
            ExternalUrl: null,
            IsRecurring: true,
            RecurrenceType: RecurrenceType.Daily,
            RecurrenceInterval: 1
        );

        await _inboxService.CreateAsync(createData, _userId);

        // Act
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var blocks = await _blockService.GetByDateAsync(_userId, today);

        // Assert - Should be urgent
        Assert.Single(blocks);
        Assert.True(blocks.First().IsUrgent);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    private class FakeAuditService : IAuditService
    {
        public Task LogAsync(
            string action,
            string entityType,
            string? entityId = null,
            Guid? userId = null,
            object? oldValues = null,
            object? newValues = null,
            string? ipAddress = null,
            string? userAgent = null)
        {
            return Task.CompletedTask;
        }

        public Task LogAuthEventAsync(
            string action,
            Guid? userId = null,
            string? email = null,
            string? ipAddress = null,
            string? userAgent = null,
            string? errorMessage = null)
        {
            return Task.CompletedTask;
        }
    }
}
