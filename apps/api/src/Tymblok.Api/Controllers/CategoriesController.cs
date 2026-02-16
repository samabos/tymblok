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
[Route("api/categories")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;
    private readonly ILogger<CategoriesController> _logger;

    public CategoriesController(
        ICategoryService categoryService,
        ILogger<CategoriesController> logger)
    {
        _categoryService = categoryService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new category
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CategoryDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request, CancellationToken ct)
    {
        var userId = GetUserId();
        var data = new CreateCategoryData(request.Name, request.Color, request.Icon);
        var category = await _categoryService.CreateAsync(data, userId, ct);

        _logger.LogInformation("Category created | CategoryId: {CategoryId} | UserId: {UserId}",
            category.Id, userId);

        return StatusCode(StatusCodes.Status201Created, WrapResponse(MapToDto(category)));
    }

    /// <summary>
    /// Get all categories for authenticated user (includes system categories)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<CategoriesResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var userId = GetUserId();
        var categories = await _categoryService.GetAllAsync(userId, ct);
        var categoryDtos = categories.Select(MapToDto).ToList();

        return Ok(WrapResponse(new CategoriesResponse(categoryDtos)));
    }

    /// <summary>
    /// Get a specific category by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<CategoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        var category = await _categoryService.GetByIdAsync(id, userId, ct);

        if (category == null)
        {
            return NotFound(CreateErrorResponse("CATEGORY_NOT_FOUND", "Category not found"));
        }

        return Ok(WrapResponse(MapToDto(category)));
    }

    /// <summary>
    /// Update a category (cannot update system categories)
    /// </summary>
    [HttpPatch("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<CategoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryRequest request, CancellationToken ct)
    {
        var userId = GetUserId();

        try
        {
            var data = new UpdateCategoryData(request.Name, request.Color, request.Icon);
            var category = await _categoryService.UpdateAsync(id, data, userId, ct);

            _logger.LogInformation("Category updated | CategoryId: {CategoryId} | UserId: {UserId}",
                category.Id, userId);

            return Ok(WrapResponse(MapToDto(category)));
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
    /// Delete a category (cannot delete system categories or categories in use)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();

        try
        {
            await _categoryService.DeleteAsync(id, userId, ct);

            _logger.LogInformation("Category deleted | CategoryId: {CategoryId} | UserId: {UserId}",
                id, userId);

            return Ok(WrapResponse(new MessageResponse("Category deleted successfully")));
        }
        catch (NotFoundException ex)
        {
            return NotFound(CreateErrorResponse(ex.Code, ex.Message));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, CreateErrorResponse(ex.Code, ex.Message));
        }
        catch (ConflictException ex)
        {
            return Conflict(CreateErrorResponse(ex.Code, ex.Message));
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

    private static CategoryDto MapToDto(Category category)
    {
        return new CategoryDto(
            category.Id,
            category.Name,
            category.Color,
            category.Icon,
            category.IsSystem,
            category.CreatedAt
        );
    }
}
