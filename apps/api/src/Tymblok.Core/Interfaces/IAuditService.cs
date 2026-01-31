namespace Tymblok.Core.Interfaces;

public interface IAuditService
{
    Task LogAsync(
        string action,
        string entityType,
        string? entityId = null,
        Guid? userId = null,
        object? oldValues = null,
        object? newValues = null,
        string? ipAddress = null,
        string? userAgent = null);

    Task LogAuthEventAsync(
        string action,
        Guid? userId = null,
        string? email = null,
        string? ipAddress = null,
        string? userAgent = null,
        string? errorMessage = null);
}
