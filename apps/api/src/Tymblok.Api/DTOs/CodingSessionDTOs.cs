using System.ComponentModel.DataAnnotations;

namespace Tymblok.Api.DTOs;

public record CreateCodingSessionRequest(
    [Required] DateTime StartedAt,
    [Required] DateTime EndedAt,
    [Required][Range(0, 86400)] int ActiveSeconds,
    [Range(0, 10000)] int FilesEdited = 0,
    [Range(0, 1000000)] int LinesAdded = 0,
    [Range(0, 1000000)] int LinesRemoved = 0,
    string? Languages = null,
    [Range(0, 10000)] int Commits = 0,
    Guid? BlockId = null,
    [MaxLength(50)] string Source = "vscode"
);

public record CodingSessionDto(
    Guid Id,
    Guid UserId,
    Guid? BlockId,
    DateTime StartedAt,
    DateTime EndedAt,
    int ActiveSeconds,
    int FilesEdited,
    int LinesAdded,
    int LinesRemoved,
    string? Languages,
    int Commits,
    string Source,
    DateTime CreatedAt
);

public record CodingSessionsResponse(IList<CodingSessionDto> Sessions);

public record CodingSessionsSummaryDto(
    int TotalSessions,
    int TotalActiveSeconds,
    int TotalFilesEdited,
    int TotalLinesAdded,
    int TotalLinesRemoved,
    int TotalCommits,
    Dictionary<string, int> LanguageBreakdown
);

public record SyncPRsRequest(IList<SyncPRItem> PullRequests);

public record SyncPRItem(
    [Required][MaxLength(200)] string ExternalId,
    [Required][MaxLength(200)] string Title,
    [MaxLength(500)] string? Subtitle = null,
    [MaxLength(500)] string? Url = null,
    [MaxLength(50)] string Source = "github",
    [MaxLength(20)] string Priority = "high",
    string? Metadata = null
);

public record SyncPRsResponse(int Created, int Updated);
