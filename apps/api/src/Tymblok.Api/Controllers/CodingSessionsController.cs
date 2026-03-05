using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tymblok.Api.DTOs;
using Tymblok.Core.Entities;
using Tymblok.Core.Interfaces;

namespace Tymblok.Api.Controllers;

[ApiController]
[Route("api/coding-sessions")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class CodingSessionsController : BaseApiController
{
    private readonly ICodingSessionService _service;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<CodingSessionsController> _logger;

    public CodingSessionsController(
        ICodingSessionService service,
        ICurrentUser currentUser,
        ILogger<CodingSessionsController> logger)
    {
        _service = service;
        _currentUser = currentUser;
        _logger = logger;
    }

    /// <summary>
    /// Accept a coding session from an IDE extension
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CodingSessionDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateCodingSessionRequest request,
        CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        var session = new CodingSession
        {
            StartedAt = request.StartedAt,
            EndedAt = request.EndedAt,
            ActiveSeconds = request.ActiveSeconds,
            FilesEdited = request.FilesEdited,
            LinesAdded = request.LinesAdded,
            LinesRemoved = request.LinesRemoved,
            Languages = request.Languages,
            Commits = request.Commits,
            BlockId = request.BlockId,
            Source = request.Source,
        };

        var result = await _service.CreateAsync(session, userId, ct);
        _logger.LogInformation(
            "Coding session created: {SessionId} for user {UserId} ({ActiveSeconds}s active)",
            result.Id, userId, result.ActiveSeconds);

        return StatusCode(StatusCodes.Status201Created, WrapResponse(MapToDto(result)));
    }

    /// <summary>
    /// Get coding sessions for a specific date
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<CodingSessionsResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByDate(
        [FromQuery] DateOnly? date,
        CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow);

        var sessions = await _service.GetByDateAsync(userId, targetDate, ct);
        var dtos = sessions.Select(MapToDto).ToList();

        return Ok(WrapResponse(new CodingSessionsResponse(dtos)));
    }

    /// <summary>
    /// Get aggregated coding stats for a date range
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<CodingSessionsSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary(
        [FromQuery] DateOnly? startDate,
        [FromQuery] DateOnly? endDate,
        CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        var start = startDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var end = endDate ?? start;

        var sessions = await _service.GetByDateRangeAsync(userId, start, end, ct);

        var languageBreakdown = new Dictionary<string, int>();
        foreach (var session in sessions)
        {
            if (string.IsNullOrEmpty(session.Languages)) continue;
            try
            {
                var langs = System.Text.Json.JsonSerializer
                    .Deserialize<Dictionary<string, int>>(session.Languages);
                if (langs == null) continue;
                foreach (var (lang, seconds) in langs)
                {
                    languageBreakdown[lang] = languageBreakdown.GetValueOrDefault(lang) + seconds;
                }
            }
            catch
            {
                // Skip malformed JSON
            }
        }

        var summary = new CodingSessionsSummaryDto(
            TotalSessions: sessions.Count,
            TotalActiveSeconds: sessions.Sum(s => s.ActiveSeconds),
            TotalFilesEdited: sessions.Sum(s => s.FilesEdited),
            TotalLinesAdded: sessions.Sum(s => s.LinesAdded),
            TotalLinesRemoved: sessions.Sum(s => s.LinesRemoved),
            TotalCommits: sessions.Sum(s => s.Commits),
            LanguageBreakdown: languageBreakdown
        );

        return Ok(WrapResponse(summary));
    }

    private static CodingSessionDto MapToDto(CodingSession session) => new(
        session.Id,
        session.UserId,
        session.BlockId,
        session.StartedAt,
        session.EndedAt,
        session.ActiveSeconds,
        session.FilesEdited,
        session.LinesAdded,
        session.LinesRemoved,
        session.Languages,
        session.Commits,
        session.Source,
        session.CreatedAt
    );
}
