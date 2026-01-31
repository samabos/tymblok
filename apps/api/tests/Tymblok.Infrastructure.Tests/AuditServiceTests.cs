using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Tymblok.Core.Entities;
using Tymblok.Infrastructure.Data;
using Tymblok.Infrastructure.Services;

namespace Tymblok.Infrastructure.Tests;

public class AuditServiceTests : IDisposable
{
    private readonly TymblokDbContext _context;
    private readonly Mock<ILogger<AuditService>> _loggerMock;
    private readonly AuditService _auditService;

    public AuditServiceTests()
    {
        var options = new DbContextOptionsBuilder<TymblokDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new TymblokDbContext(options);
        _loggerMock = new Mock<ILogger<AuditService>>();
        _auditService = new AuditService(_context, _loggerMock.Object);
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    [Fact]
    public async Task LogAsync_CreatesAuditLog()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var action = "test.action";
        var entityType = "TestEntity";
        var entityId = "123";

        // Act
        await _auditService.LogAsync(action, entityType, entityId, userId);

        // Assert
        var auditLog = await _context.AuditLogs.FirstOrDefaultAsync();
        Assert.NotNull(auditLog);
        Assert.Equal(action, auditLog.Action);
        Assert.Equal(entityType, auditLog.EntityType);
        Assert.Equal(entityId, auditLog.EntityId);
        Assert.Equal(userId, auditLog.UserId);
    }

    [Fact]
    public async Task LogAsync_WithOldAndNewValues_SerializesAsJson()
    {
        // Arrange
        var oldValues = new { Name = "Old Name", Value = 10 };
        var newValues = new { Name = "New Name", Value = 20 };

        // Act
        await _auditService.LogAsync(
            AuditAction.Update,
            "TestEntity",
            "123",
            Guid.NewGuid(),
            oldValues,
            newValues);

        // Assert
        var auditLog = await _context.AuditLogs.FirstOrDefaultAsync();
        Assert.NotNull(auditLog);
        Assert.Contains("Old Name", auditLog.OldValues);
        Assert.Contains("New Name", auditLog.NewValues);
    }

    [Fact]
    public async Task LogAsync_WithIpAddressAndUserAgent_StoresMetadata()
    {
        // Arrange
        var ipAddress = "192.168.1.1";
        var userAgent = "Mozilla/5.0 Test Browser";

        // Act
        await _auditService.LogAsync(
            "test.action",
            "TestEntity",
            ipAddress: ipAddress,
            userAgent: userAgent);

        // Assert
        var auditLog = await _context.AuditLogs.FirstOrDefaultAsync();
        Assert.NotNull(auditLog);
        Assert.Equal(ipAddress, auditLog.IpAddress);
        Assert.Equal(userAgent, auditLog.UserAgent);
    }

    [Fact]
    public async Task LogAuthEventAsync_CreatesAuthAuditLog()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var email = "test@example.com";
        var ipAddress = "192.168.1.1";

        // Act
        await _auditService.LogAuthEventAsync(
            AuditAction.Login,
            userId,
            email,
            ipAddress);

        // Assert
        var auditLog = await _context.AuditLogs.FirstOrDefaultAsync();
        Assert.NotNull(auditLog);
        Assert.Equal(AuditAction.Login, auditLog.Action);
        Assert.Equal("Auth", auditLog.EntityType);
        Assert.Equal(userId, auditLog.UserId);
        Assert.Contains(email, auditLog.NewValues);
    }

    [Fact]
    public async Task LogAuthEventAsync_WithErrorMessage_IncludesError()
    {
        // Arrange
        var email = "test@example.com";
        var errorMessage = "Invalid credentials";

        // Act
        await _auditService.LogAuthEventAsync(
            AuditAction.LoginFailed,
            email: email,
            errorMessage: errorMessage);

        // Assert
        var auditLog = await _context.AuditLogs.FirstOrDefaultAsync();
        Assert.NotNull(auditLog);
        Assert.Equal(AuditAction.LoginFailed, auditLog.Action);
        Assert.Contains(errorMessage, auditLog.NewValues);
    }

    [Fact]
    public async Task LogAsync_SetsCreatedAtAndUpdatedAt()
    {
        // Arrange
        var beforeTime = DateTime.UtcNow;

        // Act
        await _auditService.LogAsync("test.action", "TestEntity");
        var afterTime = DateTime.UtcNow;

        // Assert
        var auditLog = await _context.AuditLogs.FirstOrDefaultAsync();
        Assert.NotNull(auditLog);
        Assert.True(auditLog.CreatedAt >= beforeTime && auditLog.CreatedAt <= afterTime);
        Assert.True(auditLog.UpdatedAt >= beforeTime && auditLog.UpdatedAt <= afterTime);
    }

    [Fact]
    public async Task LogAsync_WithNullValues_DoesNotSerialize()
    {
        // Act
        await _auditService.LogAsync(
            "test.action",
            "TestEntity",
            oldValues: null,
            newValues: null);

        // Assert
        var auditLog = await _context.AuditLogs.FirstOrDefaultAsync();
        Assert.NotNull(auditLog);
        Assert.Null(auditLog.OldValues);
        Assert.Null(auditLog.NewValues);
    }
}
