using System.Text.Json;
using Microsoft.Extensions.Logging;
using Tymblok.Core.Entities;
using Tymblok.Core.Interfaces;
using Tymblok.Infrastructure.Data;

namespace Tymblok.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly TymblokDbContext _context;
    private readonly ILogger<AuditService> _logger;

    public AuditService(TymblokDbContext context, ILogger<AuditService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task LogAsync(
        string action,
        string entityType,
        string? entityId = null,
        Guid? userId = null,
        object? oldValues = null,
        object? newValues = null,
        string? ipAddress = null,
        string? userAgent = null)
    {
        var auditLog = new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            OldValues = oldValues != null ? JsonSerializer.Serialize(oldValues) : null,
            NewValues = newValues != null ? JsonSerializer.Serialize(newValues) : null,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Audit: {Action} on {EntityType} {EntityId} by user {UserId} from {IpAddress}",
            action, entityType, entityId, userId, ipAddress);
    }

    public async Task LogAuthEventAsync(
        string action,
        Guid? userId = null,
        string? email = null,
        string? ipAddress = null,
        string? userAgent = null,
        string? errorMessage = null)
    {
        var newValues = new Dictionary<string, object?>();
        if (email != null) newValues["email"] = email;
        if (errorMessage != null) newValues["error"] = errorMessage;

        await LogAsync(
            action: action,
            entityType: "Auth",
            entityId: userId?.ToString(),
            userId: userId,
            newValues: newValues.Count > 0 ? newValues : null,
            ipAddress: ipAddress,
            userAgent: userAgent);
    }
}
