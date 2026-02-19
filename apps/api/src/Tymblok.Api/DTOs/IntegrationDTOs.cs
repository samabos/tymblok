using System.ComponentModel.DataAnnotations;
using Tymblok.Core.Entities;

namespace Tymblok.Api.DTOs;

public record IntegrationDto(
    Guid Id,
    IntegrationProvider Provider,
    string? ExternalUsername,
    string? ExternalAvatarUrl,
    DateTime? LastSyncAt,
    string? LastSyncError,
    DateTime CreatedAt
);

public record IntegrationsResponse(
    IList<IntegrationDto> Integrations
);

public record ConnectIntegrationResponse(
    string AuthUrl,
    string State
);

public record IntegrationCallbackRequest(
    [Required] string Code,
    [Required] string State,
    string? RedirectUri = null
);

public record SyncResponse(
    int ItemsSynced,
    DateTime LastSyncAt
);

public record SyncAllResponse(
    int TotalItemsSynced,
    int IntegrationsSynced,
    DateTime SyncedAt
);
