using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tymblok.Api.DTOs;
using Tymblok.Core.Interfaces;

namespace Tymblok.Api.Controllers;

[ApiController]
[Route("api/stats")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class StatsController : BaseApiController
{
    private readonly IStatsService _statsService;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<StatsController> _logger;

    public StatsController(
        IStatsService statsService,
        ICurrentUser currentUser,
        ILogger<StatsController> logger)
    {
        _statsService = statsService;
        _currentUser = currentUser;
        _logger = logger;
    }

    /// <summary>
    /// Get productivity stats for the authenticated user (current week focus)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<StatsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetStats(CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        var result = await _statsService.GetStatsAsync(userId, ct);

        _logger.LogInformation(
            "Stats retrieved | UserId: {UserId} | WeekHours: {Hours} | FocusScore: {Score}",
            userId, result.ThisWeekHours, result.FocusScore);

        var response = new StatsResponse(
            WeekSummary: new StatsWeekSummary(
                result.ThisWeekHours,
                result.WeekChangePercent,
                result.TasksDone,
                result.TasksDoneChange),
            MonthSummary: new StatsMonthSummary(
                result.ThisMonthHours,
                result.MonthChangePercent,
                result.AvgHoursPerDay),
            WeeklyChart: result.WeeklyChart
                .Select(p => new StatsDailyPoint(p.DayLabel, p.Date, p.Hours, p.CompletedCount))
                .ToList(),
            CategoryBreakdown: result.CategoryBreakdown
                .Select(p => new StatsCategoryBreakdown(p.Id, p.Name, p.Color, p.Hours, p.Percent))
                .ToList(),
            Streak: new StatsStreak(result.CurrentStreak, result.BestStreak),
            FocusScore: result.FocusScore
        );

        return Ok(WrapResponse(response));
    }

}
