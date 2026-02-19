using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tymblok.Api.DTOs;
using Tymblok.Core.Entities;
using Tymblok.Core.Exceptions;
using Tymblok.Core.Interfaces;

namespace Tymblok.Api.Controllers;

[ApiController]
[Route("api/support-content")]
public class SupportContentController : BaseApiController
{
    private readonly ISupportContentService _service;
    private readonly ILogger<SupportContentController> _logger;

    public SupportContentController(
        ISupportContentService service,
        ILogger<SupportContentController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Get published support content by slug (public)
    /// </summary>
    [HttpGet("{slug}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<SupportContentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken ct)
    {
        var content = await _service.GetBySlugAsync(slug, ct);

        if (content == null)
        {
            return NotFound(CreateErrorResponse("CONTENT_NOT_FOUND", "Support content not found"));
        }

        return Ok(WrapResponse(MapToDto(content)));
    }

    /// <summary>
    /// List all published support content (public)
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<SupportContentsResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllPublished(CancellationToken ct)
    {
        var contents = await _service.GetAllPublishedAsync(ct);
        var dtos = contents.Select(MapToDto).ToList();

        return Ok(WrapResponse(new SupportContentsResponse(dtos)));
    }

    /// <summary>
    /// Create support content (admin only)
    /// </summary>
    [HttpPost]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<SupportContentDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateSupportContentRequest request, CancellationToken ct)
    {
        if (!Enum.TryParse<SupportContentType>(request.ContentType, out var contentType))
        {
            return BadRequest(CreateErrorResponse("INVALID_CONTENT_TYPE", "Invalid content type"));
        }

        var data = new CreateSupportContentData(request.Slug, request.Title, request.Content, contentType);
        var content = await _service.CreateAsync(data, ct);

        _logger.LogInformation("Support content created | ContentId: {ContentId} | Slug: {Slug}",
            content.Id, content.Slug);

        return StatusCode(StatusCodes.Status201Created, WrapResponse(MapToDto(content)));
    }

    /// <summary>
    /// Update support content (admin only)
    /// </summary>
    [HttpPatch("{id:guid}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<SupportContentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSupportContentRequest request, CancellationToken ct)
    {
        try
        {
            var data = new UpdateSupportContentData(request.Title, request.Content, request.IsPublished, request.DisplayOrder);
            var content = await _service.UpdateAsync(id, data, ct);

            _logger.LogInformation("Support content updated | ContentId: {ContentId}", content.Id);

            return Ok(WrapResponse(MapToDto(content)));
        }
        catch (NotFoundException ex)
        {
            return NotFound(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// Delete support content (admin only)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try
        {
            await _service.DeleteAsync(id, ct);

            _logger.LogInformation("Support content deleted | ContentId: {ContentId}", id);

            return Ok(WrapResponse(new MessageResponse("Support content deleted successfully")));
        }
        catch (NotFoundException ex)
        {
            return NotFound(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    private static SupportContentDto MapToDto(SupportContent content)
    {
        return new SupportContentDto(
            content.Id,
            content.Slug,
            content.Title,
            content.Content,
            content.ContentType.ToString(),
            content.IsPublished,
            content.DisplayOrder,
            content.CreatedAt,
            content.UpdatedAt
        );
    }
}
