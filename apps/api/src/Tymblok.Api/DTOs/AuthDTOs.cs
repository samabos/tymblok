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

public record ChangePasswordRequest(
    [Required] string CurrentPassword,
    [Required][MinLength(8)] string NewPassword
);

public record SetPasswordRequest(
    [Required][MinLength(8)] string Password
);

public record LogoutRequest(
    [Required] string RefreshToken
);

public record UpdateProfileRequest(
    [Required][MinLength(1)][MaxLength(100)] string Name
);

public record UpdateSettingsRequest(
    string? Timezone = null,
    string? WorkingHoursStart = null,
    string? WorkingHoursEnd = null,
    string? LunchStart = null,
    int? LunchDurationMinutes = null,
    bool? NotificationBlockReminder = null,
    int? NotificationReminderMinutes = null,
    bool? NotificationDailySummary = null
);

public record AvatarResponse(
    string AvatarUrl
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
    bool HasPassword,
    IList<string> Roles,
    DateTime CreatedAt,
    // Working hours
    string Timezone,
    string WorkingHoursStart,
    string WorkingHoursEnd,
    string LunchStart,
    int LunchDurationMinutes,
    // Notification preferences
    bool NotificationBlockReminder,
    int NotificationReminderMinutes,
    bool NotificationDailySummary,
    IList<string>? LinkedProviders = null
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

public record SessionDto(
    Guid Id,
    string? DeviceType,
    string? DeviceName,
    string? DeviceOs,
    string? IpAddress,
    bool IsCurrent,
    DateTime LastActiveAt,
    DateTime CreatedAt
);

public record SessionsResponse(
    IList<SessionDto> Sessions
);
