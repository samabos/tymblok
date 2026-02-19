using Microsoft.EntityFrameworkCore;
using Tymblok.Core.Entities;
using Tymblok.Core.Interfaces;
using Tymblok.Core.Services;
using Tymblok.Infrastructure.Data;
using Tymblok.Infrastructure.Repositories;
using Tymblok.Infrastructure.Services;

namespace Tymblok.Infrastructure.Tests.Services;

public class BlockServiceRecurrenceTests : IDisposable
{
    private readonly TymblokDbContext _context;
    private readonly BlockService _blockService;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _categoryId = Guid.NewGuid();

    public BlockServiceRecurrenceTests()
    {
        var options = new DbContextOptionsBuilder<TymblokDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new TymblokDbContext(options);

        // Seed a category
        var category = new Category
        {
            Id = _categoryId,
            Name = "Test Category",
            Color = "#000000",
            Icon = "test",
            IsSystem = false
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
    }

    [Fact]
    public async Task GetByDateAsync_WithDailyRecurrence_GeneratesOccurrence()
    {
        // Arrange - Create a recurring block starting Feb 16
        var createData = new CreateBlockData(
            Title: "Daily Standup",
            Subtitle: null,
            CategoryId: _categoryId,
            Date: new DateOnly(2026, 2, 16),
            StartTime: new TimeOnly(9, 0),
            DurationMinutes: 15,
            IsUrgent: false,
            ExternalId: null,
            ExternalUrl: null,
            IsRecurring: true,
            RecurrenceType: RecurrenceType.Daily,
            RecurrenceInterval: 1,
            RecurrenceDaysOfWeek: null,
            RecurrenceEndDate: null,
            RecurrenceMaxOccurrences: null
        );

        await _blockService.CreateAsync(createData, _userId);

        // Act - Query for Feb 17 (should generate occurrence)
        var blocksOnFeb17 = await _blockService.GetByDateAsync(_userId, new DateOnly(2026, 2, 17));

        // Assert
        Assert.Single(blocksOnFeb17);
        var block = blocksOnFeb17.First();
        Assert.Equal("Daily Standup", block.Title);
        Assert.Equal(new DateOnly(2026, 2, 17), block.Date);
        Assert.True(block.IsRecurring);
        Assert.NotNull(block.RecurrenceParentId);
    }

    [Fact]
    public async Task GetByDateAsync_AlreadyGeneratedBlock_DoesNotCreateDuplicate()
    {
        // Arrange - Create a recurring block
        var createData = new CreateBlockData(
            Title: "Daily Standup",
            Subtitle: null,
            CategoryId: _categoryId,
            Date: new DateOnly(2026, 2, 16),
            StartTime: new TimeOnly(9, 0),
            DurationMinutes: 15,
            IsUrgent: false,
            ExternalId: null,
            ExternalUrl: null,
            IsRecurring: true,
            RecurrenceType: RecurrenceType.Daily,
            RecurrenceInterval: 1
        );

        await _blockService.CreateAsync(createData, _userId);

        // Act - Query same date twice
        await _blockService.GetByDateAsync(_userId, new DateOnly(2026, 2, 17));
        var blocksSecondQuery = await _blockService.GetByDateAsync(_userId, new DateOnly(2026, 2, 17));

        // Assert - Should still only have one block
        Assert.Single(blocksSecondQuery);
    }

    [Fact]
    public async Task GetByDateRangeAsync_WithDailyRecurrence_GeneratesMultipleOccurrences()
    {
        // Arrange
        var createData = new CreateBlockData(
            Title: "Daily Standup",
            Subtitle: null,
            CategoryId: _categoryId,
            Date: new DateOnly(2026, 2, 16),
            StartTime: new TimeOnly(9, 0),
            DurationMinutes: 15,
            IsUrgent: false,
            ExternalId: null,
            ExternalUrl: null,
            IsRecurring: true,
            RecurrenceType: RecurrenceType.Daily,
            RecurrenceInterval: 1
        );

        await _blockService.CreateAsync(createData, _userId);

        // Act - Query for a week range
        var blocks = await _blockService.GetByDateRangeAsync(
            _userId,
            new DateOnly(2026, 2, 16),
            new DateOnly(2026, 2, 22)
        );

        // Assert - Should have 7 blocks (one for each day)
        Assert.Equal(7, blocks.Count);
        Assert.All(blocks, b => Assert.Equal("Daily Standup", b.Title));
    }

    [Fact]
    public async Task GetByDateAsync_WithEndDate_StopsGeneratingAfterEndDate()
    {
        // Arrange - Recurring block that ends on Feb 18
        var createData = new CreateBlockData(
            Title: "Limited Standup",
            Subtitle: null,
            CategoryId: _categoryId,
            Date: new DateOnly(2026, 2, 16),
            StartTime: new TimeOnly(9, 0),
            DurationMinutes: 15,
            IsUrgent: false,
            ExternalId: null,
            ExternalUrl: null,
            IsRecurring: true,
            RecurrenceType: RecurrenceType.Daily,
            RecurrenceInterval: 1,
            RecurrenceEndDate: new DateOnly(2026, 2, 18)
        );

        await _blockService.CreateAsync(createData, _userId);

        // Act - Query for Feb 19 (after end date)
        var blocksAfterEnd = await _blockService.GetByDateAsync(_userId, new DateOnly(2026, 2, 19));

        // Assert - Should not generate occurrence after end date
        Assert.Empty(blocksAfterEnd);
    }

    [Fact]
    public async Task GetByDateAsync_WeeklyRecurrence_OnlyGeneratesOnCorrectDay()
    {
        // Arrange - Weekly on Monday (DayOfWeek.Monday = 1)
        var createData = new CreateBlockData(
            Title: "Weekly Meeting",
            Subtitle: null,
            CategoryId: _categoryId,
            Date: new DateOnly(2026, 2, 16), // Monday
            StartTime: new TimeOnly(10, 0),
            DurationMinutes: 60,
            IsUrgent: false,
            ExternalId: null,
            ExternalUrl: null,
            IsRecurring: true,
            RecurrenceType: RecurrenceType.Weekly,
            RecurrenceInterval: 1,
            RecurrenceDaysOfWeek: "1" // Monday
        );

        await _blockService.CreateAsync(createData, _userId);

        // Act - Query Tuesday (should not generate)
        var blocksOnTuesday = await _blockService.GetByDateAsync(_userId, new DateOnly(2026, 2, 17));
        // Query next Monday (should generate)
        var blocksOnNextMonday = await _blockService.GetByDateAsync(_userId, new DateOnly(2026, 2, 23));

        // Assert
        Assert.Empty(blocksOnTuesday);
        Assert.Single(blocksOnNextMonday);
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
