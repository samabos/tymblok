using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tymblok.Api.DTOs;
using Tymblok.Core.Entities;
using Tymblok.Core.Exceptions;
using Tymblok.Core.Interfaces;

namespace Tymblok.Api.Controllers;

[ApiController]
[Route("api/blocks")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class BlocksController : BaseApiController
{
    private readonly IBlockService _blockService;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<BlocksController> _logger;

    public BlocksController(
        IBlockService blockService,
        ICurrentUser currentUser,
        ILogger<BlocksController> logger)
    {
        _blockService = blockService;
        _currentUser = currentUser;
        _logger = logger;
    }

    /// <summary>
    /// Create a new time block
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<BlockDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateBlockRequest request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        try
        {
            var data = new CreateBlockData(
                request.Title,
                request.Subtitle,
                request.CategoryId,
                request.Date,
                request.StartTime,
                request.DurationMinutes,
                request.IsUrgent,
                request.ExternalId,
                request.ExternalUrl,
                request.ExternalSource,
                request.IsRecurring,
                request.RecurrenceType,
                request.RecurrenceInterval,
                request.RecurrenceDaysOfWeek,
                request.RecurrenceEndDate,
                request.RecurrenceMaxOccurrences
            );
            var result = await _blockService.CreateAsync(data, userId, ct);

            _logger.LogInformation("Time block created | BlockId: {BlockId} | UserId: {UserId} | Date: {Date}",
                result.Block.Id, userId, result.Block.Date);

            return StatusCode(StatusCodes.Status201Created, WrapResponse(MapToDto(result.Block, result.Category)));
        }
        catch (NotFoundException ex)
        {
            return NotFound(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// Get time blocks (by date or date range)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<BlocksResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetBlocks(
        [FromQuery] DateOnly? date = null,
        [FromQuery] DateOnly? startDate = null,
        [FromQuery] DateOnly? endDate = null,
        CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;

        IList<TimeBlock> blocks;

        // If specific date is provided, use it
        if (date.HasValue)
        {
            blocks = await _blockService.GetByDateAsync(userId, date.Value, ct);
        }
        // If date range is provided, use it
        else if (startDate.HasValue && endDate.HasValue)
        {
            blocks = await _blockService.GetByDateRangeAsync(userId, startDate.Value, endDate.Value, ct);
        }
        // Default to today if no params
        else
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            blocks = await _blockService.GetByDateAsync(userId, today, ct);
        }

        var blockDtos = blocks.Select(b => MapToDto(b)).ToList();
        return Ok(WrapResponse(new BlocksResponse(blockDtos)));
    }

    /// <summary>
    /// Get a specific time block by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<BlockDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        var result = await _blockService.GetByIdAsync(id, userId, ct);

        if (result == null)
        {
            return NotFound(CreateErrorResponse("BLOCK_NOT_FOUND", "Time block not found"));
        }

        return Ok(WrapResponse(MapToDto(result.Block, result.Category)));
    }

    /// <summary>
    /// Update a time block
    /// </summary>
    [HttpPatch("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<BlockDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBlockRequest request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        try
        {
            var data = new UpdateBlockData(
                request.Title,
                request.Subtitle,
                request.CategoryId,
                request.Date,
                request.StartTime,
                request.DurationMinutes,
                request.IsUrgent,
                request.IsCompleted,
                request.Progress,
                request.SortOrder
            );
            var result = await _blockService.UpdateAsync(id, data, userId, ct);

            _logger.LogInformation("Time block updated | BlockId: {BlockId} | UserId: {UserId}",
                result.Block.Id, userId);

            return Ok(WrapResponse(MapToDto(result.Block, result.Category)));
        }
        catch (NotFoundException ex)
        {
            return NotFound(CreateErrorResponse(ex.Code, ex.Message));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// Mark a time block as completed
    /// </summary>
    [HttpPost("{id:guid}/complete")]
    [ProducesResponseType(typeof(ApiResponse<BlockDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Complete(Guid id, CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        try
        {
            var result = await _blockService.CompleteAsync(id, userId, ct);

            _logger.LogInformation("Time block completed | BlockId: {BlockId} | UserId: {UserId}",
                result.Block.Id, userId);

            return Ok(WrapResponse(MapToDto(result.Block, result.Category)));
        }
        catch (NotFoundException ex)
        {
            return NotFound(CreateErrorResponse(ex.Code, ex.Message));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// Start the timer for a time block
    /// </summary>
    [HttpPost("{id:guid}/start")]
    [ProducesResponseType(typeof(ApiResponse<BlockDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Start(Guid id, CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        try
        {
            var result = await _blockService.StartAsync(id, userId, ct);

            _logger.LogInformation("Time block started | BlockId: {BlockId} | UserId: {UserId}",
                result.Block.Id, userId);

            return Ok(WrapResponse(MapToDto(result.Block, result.Category)));
        }
        catch (NotFoundException ex)
        {
            return NotFound(CreateErrorResponse(ex.Code, ex.Message));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, CreateErrorResponse(ex.Code, ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// Pause the timer for a time block
    /// </summary>
    [HttpPost("{id:guid}/pause")]
    [ProducesResponseType(typeof(ApiResponse<BlockDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Pause(Guid id, CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        try
        {
            var result = await _blockService.PauseAsync(id, userId, ct);

            _logger.LogInformation("Time block paused | BlockId: {BlockId} | UserId: {UserId}",
                result.Block.Id, userId);

            return Ok(WrapResponse(MapToDto(result.Block, result.Category)));
        }
        catch (NotFoundException ex)
        {
            return NotFound(CreateErrorResponse(ex.Code, ex.Message));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, CreateErrorResponse(ex.Code, ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// Resume the timer for a time block (same as start)
    /// </summary>
    [HttpPost("{id:guid}/resume")]
    [ProducesResponseType(typeof(ApiResponse<BlockDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Resume(Guid id, CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        try
        {
            // Resume is the same as start (start handles both first start and resume)
            var result = await _blockService.StartAsync(id, userId, ct);

            _logger.LogInformation("Time block resumed | BlockId: {BlockId} | UserId: {UserId}",
                result.Block.Id, userId);

            return Ok(WrapResponse(MapToDto(result.Block, result.Category)));
        }
        catch (NotFoundException ex)
        {
            return NotFound(CreateErrorResponse(ex.Code, ex.Message));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, CreateErrorResponse(ex.Code, ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// Delete a time block
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        try
        {
            await _blockService.DeleteAsync(id, userId, ct);

            _logger.LogInformation("Time block deleted | BlockId: {BlockId} | UserId: {UserId}",
                id, userId);

            return Ok(WrapResponse(new MessageResponse("Time block deleted successfully")));
        }
        catch (NotFoundException ex)
        {
            return NotFound(CreateErrorResponse(ex.Code, ex.Message));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// Restore a deleted time block
    /// </summary>
    [HttpPost("{id:guid}/restore")]
    [ProducesResponseType(typeof(ApiResponse<BlockDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Restore(Guid id, CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        try
        {
            var result = await _blockService.RestoreAsync(id, userId, ct);

            _logger.LogInformation("Time block restored | BlockId: {BlockId} | UserId: {UserId}",
                result.Block.Id, userId);

            return Ok(WrapResponse(MapToDto(result.Block, result.Category)));
        }
        catch (NotFoundException ex)
        {
            return NotFound(CreateErrorResponse(ex.Code, ex.Message));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, CreateErrorResponse(ex.Code, ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// Carry over uncompleted tasks from past dates to today
    /// </summary>
    [HttpPost("carry-over")]
    [ProducesResponseType(typeof(ApiResponse<CarryOverResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CarryOver(CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        var carriedOver = await _blockService.CarryOverAsync(userId, ct);
        var blockDtos = carriedOver.Select(b => MapToDto(b)).ToList();

        if (carriedOver.Count > 0)
        {
            _logger.LogInformation(
                "Blocks carried over | UserId: {UserId} | Count: {Count}",
                userId, carriedOver.Count);
        }

        return Ok(WrapResponse(new CarryOverResponse(blockDtos, carriedOver.Count)));
    }

    private static BlockDto MapToDto(TimeBlock block, CategoryData? categoryData = null)
    {
        // Use the provided categoryData or fall back to the navigation property
        Category? cat = categoryData == null ? block.Category : null;
        if (categoryData == null && cat == null)
        {
            throw new InvalidOperationException($"Category is null for TimeBlock {block.Id} (CategoryId: {block.CategoryId})");
        }

        var categoryDto = categoryData != null
            ? new CategoryDto(
                categoryData.Id,
                categoryData.Name,
                categoryData.Color,
                categoryData.Icon,
                categoryData.IsSystem,
                categoryData.CreatedAt)
            : new CategoryDto(
                cat!.Id,
                cat.Name,
                cat.Color,
                cat.Icon,
            cat.IsSystem,
            cat.CreatedAt
        );

        // Map recurrence rule if exists
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
                block.RecurrenceRule.UpdatedAt
            );
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
            block.RecurrenceParentId
        );
    }
}
