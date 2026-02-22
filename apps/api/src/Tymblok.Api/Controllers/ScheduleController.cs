using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tymblok.Api.DTOs;
using Tymblok.Core.Entities;
using Tymblok.Core.Exceptions;
using Tymblok.Core.Interfaces;

namespace Tymblok.Api.Controllers;

[ApiController]
[Route("api/schedule")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class ScheduleController : BaseApiController
{
    private readonly ISchedulerService _schedulerService;
    private readonly IBlockService _blockService;
    private readonly IInboxService _inboxService;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<ScheduleController> _logger;

    public ScheduleController(
        ISchedulerService schedulerService,
        IBlockService blockService,
        IInboxService inboxService,
        ICurrentUser currentUser,
        ILogger<ScheduleController> logger)
    {
        _schedulerService = schedulerService;
        _blockService = blockService;
        _inboxService = inboxService;
        _currentUser = currentUser;
        _logger = logger;
    }

    /// <summary>
    /// Generate an optimized schedule proposal for a given date
    /// </summary>
    [HttpPost("auto-plan")]
    [ProducesResponseType(typeof(ApiResponse<ScheduleProposalResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AutoPlan([FromBody] AutoPlanRequest request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        try
        {
            var data = new AutoPlanData(request.Date, request.InboxItemIds);
            var proposal = await _schedulerService.AutoPlanAsync(data, userId, ct);

            _logger.LogInformation(
                "Auto-plan requested | UserId: {UserId} | Date: {Date} | Proposed: {Count}",
                userId, request.Date, proposal.ProposedBlocks.Count);

            return Ok(WrapResponse(MapToResponse(proposal)));
        }
        catch (NotFoundException ex)
        {
            return NotFound(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// Regenerate a schedule, optionally keeping specific blocks fixed
    /// </summary>
    [HttpPost("replan")]
    [ProducesResponseType(typeof(ApiResponse<ScheduleProposalResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Replan([FromBody] ReplanRequest request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        try
        {
            var data = new ReplanData(request.Date, request.KeepBlockIds);
            var proposal = await _schedulerService.ReplanAsync(data, userId, ct);

            _logger.LogInformation(
                "Replan requested | UserId: {UserId} | Date: {Date} | Proposed: {Count}",
                userId, request.Date, proposal.ProposedBlocks.Count);

            return Ok(WrapResponse(MapToResponse(proposal)));
        }
        catch (NotFoundException ex)
        {
            return NotFound(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// Accept a schedule proposal — creates TimeBlocks and marks InboxItems as scheduled
    /// </summary>
    [HttpPost("accept")]
    [ProducesResponseType(typeof(ApiResponse<AcceptPlanResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AcceptPlan([FromBody] AcceptPlanRequest request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        try
        {
            var createdBlocks = new List<BlockDto>();

            foreach (var accepted in request.Blocks)
            {
                var blockData = new CreateBlockData(
                    accepted.Title,
                    accepted.Subtitle,
                    accepted.CategoryId,
                    accepted.Date,
                    accepted.StartTime,
                    accepted.DurationMinutes,
                    accepted.IsUrgent,
                    ExternalId: null,
                    ExternalUrl: null);

                var result = await _blockService.CreateAsync(blockData, userId, ct);

                // Mark inbox item as scheduled if linked
                if (accepted.InboxItemId.HasValue)
                {
                    var inboxItem = await _inboxService.GetByIdAsync(accepted.InboxItemId.Value, userId, ct);
                    if (inboxItem != null)
                    {
                        await _inboxService.UpdateAsync(
                            accepted.InboxItemId.Value,
                            new UpdateInboxItemData(
                                inboxItem.Title,
                                inboxItem.Description,
                                inboxItem.Priority,
                                IsDismissed: null),
                            userId, ct);

                        // Directly set scheduling fields
                        inboxItem.IsScheduled = true;
                        inboxItem.ScheduledBlockId = result.Block.Id;
                    }
                }

                createdBlocks.Add(MapBlockToDto(result.Block, result.Category));
            }

            _logger.LogInformation(
                "Schedule accepted | UserId: {UserId} | Blocks created: {Count}",
                userId, createdBlocks.Count);

            return StatusCode(StatusCodes.Status201Created,
                WrapResponse(new AcceptPlanResponse(createdBlocks, createdBlocks.Count)));
        }
        catch (NotFoundException ex)
        {
            return NotFound(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    // ========================================================================
    // Mapping Helpers
    // ========================================================================

    private static ScheduleProposalResponse MapToResponse(ScheduleProposal proposal)
    {
        var blocks = proposal.ProposedBlocks.Select(b => new ProposedBlockDto(
            b.Title,
            b.Subtitle,
            b.CategoryId,
            b.CategoryName,
            b.CategoryColor,
            b.CategoryIcon,
            b.Date,
            b.StartTime,
            b.EndTime,
            b.DurationMinutes,
            b.IsUrgent,
            b.InboxItemId,
            b.Zone)).ToList();

        var score = new ScheduleScoreDto(
            proposal.Score.Overall,
            proposal.Score.FocusTimeScore,
            proposal.Score.PriorityCoverage,
            proposal.Score.ContextSwitchScore,
            proposal.Score.BufferTimeScore);

        return new ScheduleProposalResponse(blocks, score, proposal.Warnings);
    }

    private static BlockDto MapBlockToDto(TimeBlock block, CategoryData category)
    {
        var categoryDto = new CategoryDto(
            category.Id, category.Name, category.Color,
            category.Icon, category.IsSystem, category.CreatedAt);

        RecurrenceRuleDto? recurrenceRuleDto = null;
        if (block.RecurrenceRule != null)
        {
            recurrenceRuleDto = new RecurrenceRuleDto(
                block.RecurrenceRule.Id,
                block.RecurrenceRule.Type,
                block.RecurrenceRule.Interval,
                block.RecurrenceRule.DaysOfWeek,
                block.RecurrenceRule.EndDate,
                block.RecurrenceRule.MaxOccurrences,
                block.RecurrenceRule.CreatedAt,
                block.RecurrenceRule.UpdatedAt);
        }

        return new BlockDto(
            block.Id,
            block.Title,
            block.Subtitle,
            block.CategoryId,
            categoryDto,
            block.Date,
            block.StartTime,
            block.EndTime,
            block.DurationMinutes,
            block.IsUrgent,
            block.IsCompleted,
            block.Progress,
            block.ElapsedSeconds,
            block.SortOrder,
            block.ExternalId,
            block.ExternalUrl,
            block.ExternalSource,
            block.CreatedAt,
            block.CompletedAt,
            block.TimerState,
            block.StartedAt,
            block.PausedAt,
            block.ResumedAt,
            block.IsRecurring,
            block.RecurrenceRuleId,
            recurrenceRuleDto,
            block.RecurrenceParentId);
    }
}
