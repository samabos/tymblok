using System.ComponentModel.DataAnnotations;

namespace Tymblok.Api.DTOs;

public record RegisterRequest(
    [Required][EmailAddress] string Email,
    [Required][MinLength(8)] string Password,
    [Required][MinLength(1)] string Name
);

public record LoginRequest(
    [Required][EmailAddress] string Email,
    [Required] string Password
);

public record RefreshRequest(
    [Required] string RefreshToken
);

public record ForgotPasswordRequest(
    [Required][EmailAddress] string Email
);

public record ResetPasswordRequest(
    [Required][EmailAddress] string Email,
    [Required] string Token,
    [Required][MinLength(8)] string NewPassword
);

public record VerifyEmailRequest(
    [Required] Guid UserId,
    [Required] string Token
);

public record ResendVerificationRequest(
    [Required] Guid UserId
);

public record UserDto(
    Guid Id,
    string Email,
    string Name,
    string? AvatarUrl,
    string Theme,
    bool HighContrast,
    bool ReduceMotion,
    string TextSize,
    bool EmailVerified,
    IList<string> Roles,
    DateTime CreatedAt
);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    UserDto User
);

public record RefreshResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn
);

public record MessageResponse(
    string Message
);

public record ApiResponse<T>(
    T Data,
    ApiMeta Meta
);

public record ApiMeta(
    string Timestamp,
    string RequestId
);

public record ApiError(
    ErrorDetails Error,
    ApiMeta Meta
);

public record ErrorDetails(
    string Code,
    string Message,
    List<FieldError>? Details = null
);

public record FieldError(
    string Field,
    string Message
);
