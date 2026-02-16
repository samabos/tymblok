using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tymblok.Api.DTOs;
using Tymblok.Core.Entities;
using Tymblok.Core.Exceptions;
using Tymblok.Core.Interfaces;

namespace Tymblok.Api.Controllers;

[ApiController]
[Route("api/inbox")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class InboxController : ControllerBase
{
    private readonly IInboxService _inboxService;
    private readonly ILogger<InboxController> _logger;

    public InboxController(
        IInboxService inboxService,
        ILogger<InboxController> logger)
    {
        _inboxService = inboxService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new inbox item
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<InboxItemDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateInboxItemRequest request, CancellationToken ct)
    {
        var userId = GetUserId();
        var data = new CreateInboxItemData(
            request.Title,
            request.Description,
            request.Priority,
            request.IntegrationId,
            request.ExternalId,
            request.ExternalUrl,
            request.IsRecurring,
            request.RecurrenceType,
            request.RecurrenceInterval,
            request.RecurrenceDaysOfWeek,
            request.RecurrenceEndDate,
            request.RecurrenceMaxOccurrences
        );
        var item = await _inboxService.CreateAsync(data, userId, ct);

        _logger.LogInformation("Inbox item created | ItemId: {ItemId} | UserId: {UserId}",
            item.Id, userId);

        return StatusCode(StatusCodes.Status201Created, WrapResponse(MapToDto(item)));
    }

    /// <summary>
    /// Get all inbox items for authenticated user (with optional filters)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<InboxItemsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool? isDismissed = null,
        [FromQuery] InboxSource? source = null,
        [FromQuery] InboxPriority? priority = null,
        CancellationToken ct = default)
    {
        var userId = GetUserId();
        var filters = new InboxItemFilters(isDismissed, source, priority);
        var items = await _inboxService.GetAllAsync(userId, filters, ct);
        var itemDtos = items.Select(MapToDto).ToList();

        return Ok(WrapResponse(new InboxItemsResponse(itemDtos)));
    }

    /// <summary>
    /// Get a specific inbox item by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<InboxItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        var item = await _inboxService.GetByIdAsync(id, userId, ct);

        if (item == null)
        {
            return NotFound(CreateErrorResponse("INBOX_ITEM_NOT_FOUND", "Inbox item not found"));
        }

        return Ok(WrapResponse(MapToDto(item)));
    }

    /// <summary>
    /// Update an inbox item
    /// </summary>
    [HttpPatch("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<InboxItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateInboxItemRequest request, CancellationToken ct)
    {
        var userId = GetUserId();

        try
        {
            var data = new UpdateInboxItemData(
                request.Title,
                request.Description,
                request.Priority,
                request.IsDismissed
            );
            var item = await _inboxService.UpdateAsync(id, data, userId, ct);

            _logger.LogInformation("Inbox item updated | ItemId: {ItemId} | UserId: {UserId}",
                item.Id, userId);

            return Ok(WrapResponse(MapToDto(item)));
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
    /// Mark an inbox item as dismissed
    /// </summary>
    [HttpPatch("{id:guid}/dismiss")]
    [ProducesResponseType(typeof(ApiResponse<InboxItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Dismiss(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();

        try
        {
            var item = await _inboxService.DismissAsync(id, userId, ct);

            _logger.LogInformation("Inbox item dismissed | ItemId: {ItemId} | UserId: {UserId}",
                item.Id, userId);

            return Ok(WrapResponse(MapToDto(item)));
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
    /// Delete an inbox item
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();

        try
        {
            await _inboxService.DeleteAsync(id, userId, ct);

            _logger.LogInformation("Inbox item deleted | ItemId: {ItemId} | UserId: {UserId}",
                id, userId);

            return Ok(WrapResponse(new MessageResponse("Inbox item deleted successfully")));
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

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim ?? throw new UnauthorizedAccessException());
    }

    private ApiResponse<T> WrapResponse<T>(T data)
    {
        return new ApiResponse<T>(
            data,
            new ApiMeta(DateTime.UtcNow.ToString("o"), HttpContext.TraceIdentifier)
        );
    }

    private ApiError CreateErrorResponse(string code, string message)
    {
        return new ApiError(
            new ErrorDetails(code, message),
            new ApiMeta(DateTime.UtcNow.ToString("o"), HttpContext.TraceIdentifier)
        );
    }

    private static InboxItemDto MapToDto(InboxItem item)
    {
        RecurrenceRuleDto? recurrenceRuleDto = null;
        if (item.RecurrenceRule != null)
        {
            recurrenceRuleDto = new RecurrenceRuleDto(
                item.RecurrenceRule.Id,
                item.RecurrenceRule.Type,
                item.RecurrenceRule.Interval,
                item.RecurrenceRule.DaysOfWeek,
                item.RecurrenceRule.EndDate,
                item.RecurrenceRule.MaxOccurrences,
                item.RecurrenceRule.CreatedAt,
                item.RecurrenceRule.UpdatedAt
            );
        }

        return new InboxItemDto(
            item.Id,
            item.Title,
            item.Description,
            item.Source,
            item.Type,
            item.Priority,
            item.ExternalId,
            item.ExternalUrl,
            item.IsDismissed,
            item.IsScheduled,
            item.ScheduledBlockId,
            item.CreatedAt,
            item.DismissedAt,
            item.IsRecurring,
            item.RecurrenceRuleId,
            recurrenceRuleDto
        );
    }
}
