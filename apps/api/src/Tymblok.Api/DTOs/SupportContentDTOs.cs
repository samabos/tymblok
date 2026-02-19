using System.ComponentModel.DataAnnotations;

namespace Tymblok.Api.DTOs;

public record SupportContentDto(
    Guid Id,
    string Slug,
    string Title,
    string Content,
    string ContentType,
    bool IsPublished,
    int DisplayOrder,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record SupportContentsResponse(
    IList<SupportContentDto> Contents
);

public record CreateSupportContentRequest(
    [Required][MinLength(1)][MaxLength(100)] string Slug,
    [Required][MinLength(1)][MaxLength(200)] string Title,
    [Required][MinLength(1)] string Content,
    [Required] string ContentType
);

public record UpdateSupportContentRequest(
    [MaxLength(200)] string? Title = null,
    string? Content = null,
    bool? IsPublished = null,
    int? DisplayOrder = null
);
