using System.ComponentModel.DataAnnotations;

namespace Tymblok.Api.DTOs;

public record CreateCategoryRequest(
    [Required][MinLength(1)][MaxLength(50)] string Name,
    [Required][RegularExpression(@"^#[0-9A-Fa-f]{6}$", ErrorMessage = "Color must be a valid hex color (e.g., #6366f1)")] string Color,
    [Required][MinLength(1)][MaxLength(50)] string Icon
);

public record UpdateCategoryRequest(
    [Required][MinLength(1)][MaxLength(50)] string Name,
    [Required][RegularExpression(@"^#[0-9A-Fa-f]{6}$", ErrorMessage = "Color must be a valid hex color (e.g., #6366f1)")] string Color,
    [Required][MinLength(1)][MaxLength(50)] string Icon
);

public record CategoryDto(
    Guid Id,
    string Name,
    string Color,
    string Icon,
    bool IsSystem,
    DateTime CreatedAt
);

public record CategoriesResponse(
    IList<CategoryDto> Categories
);
