using System.ComponentModel.DataAnnotations;

namespace Tymblok.Api.DTOs;

public record WaitlistRequest(
    [Required] [EmailAddress] [MaxLength(255)] string Email,
    [MaxLength(100)] string? Name,
    [MaxLength(50)] string? Source
);

public record WaitlistResponse(string Message, bool AlreadySubscribed);
