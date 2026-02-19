using System.Security.Claims;
using AspNet.Security.OAuth.GitHub;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Tymblok.Api.DTOs;
using Tymblok.Core.Entities;
using Tymblok.Core.Exceptions;
using Tymblok.Core.Interfaces;

namespace Tymblok.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<AuthController> _logger;
    private readonly IConfiguration _configuration;

    public AuthController(
        IAuthService authService,
        UserManager<ApplicationUser> userManager,
        ICurrentUser currentUser,
        ILogger<AuthController> logger,
        IConfiguration configuration)
    {
        _authService = authService;
        _userManager = userManager;
        _currentUser = currentUser;
        _logger = logger;
        _configuration = configuration;
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var ipAddress = GetIpAddress();
            var (deviceType, deviceName, deviceOs) = GetDeviceInfo();
            var result = await _authService.RegisterAsync(request.Email, request.Password, request.Name, ipAddress, deviceType, deviceName, deviceOs);

            _logger.LogInformation("User registered | UserId: {UserId} | IP: {IpAddress}", result.User.Id, ipAddress);

            var roles = await _userManager.GetRolesAsync(result.User);
            var hasPassword = await _userManager.HasPasswordAsync(result.User);
            var response = CreateAuthResponse(result, roles, hasPassword);
            return StatusCode(StatusCodes.Status201Created, WrapResponse(response));
        }
        catch (AuthException ex) when (ex.Code == "CONFLICT")
        {
            _logger.LogWarning("Registration failed - email exists | IP: {IpAddress}", GetIpAddress());
            return Conflict(CreateErrorResponse(ex.Code, ex.Message));
        }
        catch (AuthException ex) when (ex.Code == "VALIDATION_ERROR")
        {
            _logger.LogWarning("Registration failed - validation error | IP: {IpAddress}", GetIpAddress());
            return BadRequest(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var ipAddress = GetIpAddress();
        var (deviceType, deviceName, deviceOs) = GetDeviceInfo();
        try
        {
            var result = await _authService.LoginAsync(request.Email, request.Password, ipAddress, deviceType, deviceName, deviceOs);

            _logger.LogInformation("User logged in | UserId: {UserId} | IP: {IpAddress}", result.User.Id, ipAddress);

            var roles = await _userManager.GetRolesAsync(result.User);
            var hasPassword = await _userManager.HasPasswordAsync(result.User);
            var response = CreateAuthResponse(result, roles, hasPassword);
            return Ok(WrapResponse(response));
        }
        catch (AuthException ex) when (ex.Code == "AUTH_INVALID_CREDENTIALS")
        {
            _logger.LogWarning("Login failed - invalid credentials | IP: {IpAddress}", ipAddress);
            return Unauthorized(CreateErrorResponse(ex.Code, ex.Message));
        }
        catch (AuthException ex) when (ex.Code == "AUTH_LOCKED_OUT")
        {
            _logger.LogWarning("Login failed - account locked | IP: {IpAddress}", ipAddress);
            return Unauthorized(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ApiResponse<RefreshResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
    {
        var ipAddress = GetIpAddress();
        try
        {
            var result = await _authService.RefreshTokenAsync(request.RefreshToken, ipAddress);

            _logger.LogDebug("Token refreshed | IP: {IpAddress}", ipAddress);

            var response = new RefreshResponse(result.AccessToken, result.RefreshToken, result.ExpiresIn);
            return Ok(WrapResponse(response));
        }
        catch (AuthException ex)
        {
            _logger.LogWarning("Token refresh failed | Code: {Code} | IP: {IpAddress}", ex.Code, ipAddress);
            return Unauthorized(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    [HttpPost("logout")]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
    {
        var ipAddress = GetIpAddress();
        try
        {
            await _authService.RevokeTokenAsync(request.RefreshToken, ipAddress);
            _logger.LogInformation("User logged out | IP: {IpAddress}", ipAddress);
            return Ok(WrapResponse(new MessageResponse("Logged out successfully")));
        }
        catch (Exception)
        {
            // Still return success even if token was already revoked or invalid
            // This prevents information leakage about token validity
            return Ok(WrapResponse(new MessageResponse("Logged out successfully")));
        }
    }

    [HttpPost("forgot-password")]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var ipAddress = GetIpAddress();

        // Always return success to not reveal if email exists
        await _authService.SendPasswordResetAsync(request.Email);

        _logger.LogInformation("Password reset requested | Email: {Email} | IP: {IpAddress}",
            request.Email.Substring(0, Math.Min(3, request.Email.Length)) + "***", ipAddress);

        return Ok(WrapResponse(new MessageResponse("If this email exists, a password reset link has been sent.")));
    }

    [HttpPost("reset-password")]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var ipAddress = GetIpAddress();
        var decodedToken = Uri.UnescapeDataString(request.Token);

        var success = await _authService.ResetPasswordAsync(request.Email, decodedToken, request.NewPassword);

        if (!success)
        {
            _logger.LogWarning("Password reset failed - invalid token | IP: {IpAddress}", ipAddress);
            return BadRequest(CreateErrorResponse("INVALID_TOKEN", "The password reset link is invalid or has expired."));
        }

        _logger.LogInformation("Password reset successful | IP: {IpAddress}", ipAddress);
        return Ok(WrapResponse(new MessageResponse("Your password has been reset successfully.")));
    }

    [HttpPost("change-password")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var ipAddress = GetIpAddress();
        var userId = _currentUser.UserId;

        try
        {
            await _authService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);
            _logger.LogInformation("Password changed | UserId: {UserId} | IP: {IpAddress}", userId, ipAddress);
            return Ok(WrapResponse(new MessageResponse("Your password has been changed successfully.")));
        }
        catch (AuthException ex)
        {
            _logger.LogWarning("Password change failed | UserId: {UserId} | Code: {Code} | IP: {IpAddress}",
                userId, ex.Code, ipAddress);
            return BadRequest(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    [HttpPost("set-password")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetPassword([FromBody] SetPasswordRequest request)
    {
        var ipAddress = GetIpAddress();
        var userId = _currentUser.UserId;

        try
        {
            await _authService.SetPasswordAsync(userId, request.Password);
            _logger.LogInformation("Password set | UserId: {UserId} | IP: {IpAddress}", userId, ipAddress);
            return Ok(WrapResponse(new MessageResponse("Your password has been set successfully.")));
        }
        catch (AuthException ex)
        {
            _logger.LogWarning("Set password failed | UserId: {UserId} | Code: {Code} | IP: {IpAddress}",
                userId, ex.Code, ipAddress);
            return BadRequest(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// Update user profile (name only)
    /// </summary>
    [HttpPatch("profile")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var ipAddress = GetIpAddress();
        var userId = _currentUser.UserId;

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return NotFound(CreateErrorResponse("USER_NOT_FOUND", "User not found"));
        }

        user.Name = request.Name.Trim();
        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            _logger.LogWarning("Profile update failed | UserId: {UserId} | Errors: {Errors} | IP: {IpAddress}",
                userId, errors, ipAddress);
            return BadRequest(CreateErrorResponse("UPDATE_FAILED", errors));
        }

        _logger.LogInformation("Profile updated | UserId: {UserId} | IP: {IpAddress}", userId, ipAddress);

        var roles = await _userManager.GetRolesAsync(user);
        var hasPassword = await _userManager.HasPasswordAsync(user);
        var userDto = MapToUserDto(user, roles, hasPassword);

        return Ok(WrapResponse(userDto));
    }

    /// <summary>
    /// Update user settings (working hours, notification preferences)
    /// </summary>
    [HttpPatch("settings")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateSettingsRequest request)
    {
        var ipAddress = GetIpAddress();
        var userId = _currentUser.UserId;

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return NotFound(CreateErrorResponse("USER_NOT_FOUND", "User not found"));
        }

        // Working hours
        if (request.Timezone != null)
            user.Timezone = request.Timezone;

        if (request.WorkingHoursStart != null)
        {
            if (TimeOnly.TryParse(request.WorkingHoursStart, out var start))
                user.WorkingHoursStart = start;
            else
                return BadRequest(CreateErrorResponse("INVALID_TIME", "Invalid working hours start time format. Use HH:mm."));
        }

        if (request.WorkingHoursEnd != null)
        {
            if (TimeOnly.TryParse(request.WorkingHoursEnd, out var end))
                user.WorkingHoursEnd = end;
            else
                return BadRequest(CreateErrorResponse("INVALID_TIME", "Invalid working hours end time format. Use HH:mm."));
        }

        if (request.LunchStart != null)
        {
            if (TimeOnly.TryParse(request.LunchStart, out var lunch))
                user.LunchStart = lunch;
            else
                return BadRequest(CreateErrorResponse("INVALID_TIME", "Invalid lunch start time format. Use HH:mm."));
        }

        if (request.LunchDurationMinutes.HasValue)
        {
            if (request.LunchDurationMinutes.Value is >= 0 and <= 180)
                user.LunchDurationMinutes = request.LunchDurationMinutes.Value;
            else
                return BadRequest(CreateErrorResponse("INVALID_DURATION", "Lunch duration must be between 0 and 180 minutes."));
        }

        // Notification preferences
        if (request.NotificationBlockReminder.HasValue)
            user.NotificationBlockReminder = request.NotificationBlockReminder.Value;

        if (request.NotificationReminderMinutes.HasValue)
        {
            if (request.NotificationReminderMinutes.Value is >= 1 and <= 60)
                user.NotificationReminderMinutes = request.NotificationReminderMinutes.Value;
            else
                return BadRequest(CreateErrorResponse("INVALID_REMINDER", "Reminder minutes must be between 1 and 60."));
        }

        if (request.NotificationDailySummary.HasValue)
            user.NotificationDailySummary = request.NotificationDailySummary.Value;

        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            _logger.LogWarning("Settings update failed | UserId: {UserId} | Errors: {Errors} | IP: {IpAddress}",
                userId, errors, ipAddress);
            return BadRequest(CreateErrorResponse("UPDATE_FAILED", errors));
        }

        _logger.LogInformation("Settings updated | UserId: {UserId} | IP: {IpAddress}", userId, ipAddress);

        var roles = await _userManager.GetRolesAsync(user);
        var hasPassword = await _userManager.HasPasswordAsync(user);
        var userDto = MapToUserDto(user, roles, hasPassword);

        return Ok(WrapResponse(userDto));
    }

    /// <summary>
    /// Upload user avatar image (stored as base64 data URL in database)
    /// </summary>
    [HttpPost("avatar")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [ProducesResponseType(typeof(ApiResponse<AvatarResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [RequestSizeLimit(2 * 1024 * 1024)] // 2MB limit for base64 storage
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        var ipAddress = GetIpAddress();
        var userId = _currentUser.UserId;

        // Validate file
        if (file == null || file.Length == 0)
        {
            return BadRequest(CreateErrorResponse("INVALID_FILE", "No file provided"));
        }

        // Validate file type
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
        var contentType = file.ContentType.ToLowerInvariant();
        if (!allowedTypes.Contains(contentType))
        {
            return BadRequest(CreateErrorResponse("INVALID_FILE_TYPE", "Only JPEG, PNG, GIF, and WebP images are allowed"));
        }

        // Validate file size (2MB max for base64 storage)
        if (file.Length > 2 * 1024 * 1024)
        {
            return BadRequest(CreateErrorResponse("FILE_TOO_LARGE", "File size must be less than 2MB"));
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return NotFound(CreateErrorResponse("USER_NOT_FOUND", "User not found"));
        }

        try
        {
            // Read file bytes and convert to base64 data URL
            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            var base64 = Convert.ToBase64String(memoryStream.ToArray());
            var avatarUrl = $"data:{contentType};base64,{base64}";

            user.AvatarUrl = avatarUrl;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.LogWarning("Avatar update failed | UserId: {UserId} | Errors: {Errors} | IP: {IpAddress}",
                    userId, errors, ipAddress);
                return BadRequest(CreateErrorResponse("UPDATE_FAILED", errors));
            }

            _logger.LogInformation("Avatar uploaded | UserId: {UserId} | Size: {Size} bytes | IP: {IpAddress}",
                userId, file.Length, ipAddress);

            return Ok(WrapResponse(new AvatarResponse(avatarUrl)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Avatar upload failed | UserId: {UserId} | IP: {IpAddress}", userId, ipAddress);
            return BadRequest(CreateErrorResponse("UPLOAD_FAILED", "Failed to upload avatar"));
        }
    }

    /// <summary>
    /// Delete user avatar
    /// </summary>
    [HttpDelete("avatar")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAvatar()
    {
        var ipAddress = GetIpAddress();
        var userId = _currentUser.UserId;

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return NotFound(CreateErrorResponse("USER_NOT_FOUND", "User not found"));
        }

        user.AvatarUrl = null;
        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            _logger.LogWarning("Avatar delete failed | UserId: {UserId} | Errors: {Errors} | IP: {IpAddress}",
                userId, errors, ipAddress);
            return BadRequest(CreateErrorResponse("UPDATE_FAILED", errors));
        }

        _logger.LogInformation("Avatar deleted | UserId: {UserId} | IP: {IpAddress}", userId, ipAddress);

        return Ok(WrapResponse(new MessageResponse("Avatar has been deleted")));
    }

    [HttpPost("verify-email")]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        var ipAddress = GetIpAddress();
        var decodedToken = Uri.UnescapeDataString(request.Token);

        var success = await _authService.VerifyEmailAsync(request.UserId, decodedToken);

        if (!success)
        {
            _logger.LogWarning("Email verification failed - invalid token | UserId: {UserId} | IP: {IpAddress}",
                request.UserId, ipAddress);
            return BadRequest(CreateErrorResponse("INVALID_TOKEN", "The verification link is invalid or has expired."));
        }

        _logger.LogInformation("Email verified | UserId: {UserId} | IP: {IpAddress}", request.UserId, ipAddress);
        return Ok(WrapResponse(new MessageResponse("Your email has been verified successfully.")));
    }

    [HttpPost("resend-verification")]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest request)
    {
        var ipAddress = GetIpAddress();

        try
        {
            await _authService.SendEmailVerificationAsync(request.UserId);
            _logger.LogInformation("Verification email resent | UserId: {UserId} | IP: {IpAddress}",
                request.UserId, ipAddress);
            return Ok(WrapResponse(new MessageResponse("Verification email has been sent.")));
        }
        catch (AuthException ex) when (ex.Code == "USER_NOT_FOUND")
        {
            return NotFound(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// Initiate external OAuth login (redirects to provider)
    /// </summary>
    [HttpGet("external/{provider}")]
    [ProducesResponseType(StatusCodes.Status302Found)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    public IActionResult ExternalLogin(
        string provider,
        [FromQuery] string? returnUrl = null,
        [FromQuery] bool mobile = false,
        [FromQuery] string? redirectUrl = null)
    {
        var normalizedProvider = provider.ToLowerInvariant() switch
        {
            "google" => GoogleDefaults.AuthenticationScheme,
            "github" => GitHubAuthenticationDefaults.AuthenticationScheme,
            _ => null
        };

        if (normalizedProvider == null)
        {
            return BadRequest(CreateErrorResponse("INVALID_PROVIDER",
                "Invalid OAuth provider. Supported: google, github"));
        }

        // Build callback URL with state
        var state = mobile ? "mobile" : "web";
        var callbackUrl = Url.Action(nameof(ExternalLoginCallback), "Auth",
            new { returnUrl, state, redirectUrl }, Request.Scheme);

        var properties = new AuthenticationProperties
        {
            RedirectUri = callbackUrl,
            Items = { { "returnUrl", returnUrl ?? "/" }, { "mobile", mobile.ToString() }, { "redirectUrl", redirectUrl ?? "" } }
        };

        return Challenge(properties, normalizedProvider);
    }

    /// <summary>
    /// OAuth callback endpoint - handles provider redirect
    /// </summary>
    [HttpGet("external/callback")]
    public async Task<IActionResult> ExternalLoginCallback(
        [FromQuery] string? returnUrl = null,
        [FromQuery] string? state = null,
        [FromQuery] string? redirectUrl = null)
    {
        var ipAddress = GetIpAddress();
        var (deviceType, deviceName, deviceOs) = GetDeviceInfo();
        var isMobile = state == "mobile";

        try
        {
            // Try to authenticate with each provider
            AuthenticateResult? authenticateResult = null;
            string? provider = null;

            // Try Google first
            var googleResult = await HttpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);
            if (googleResult.Succeeded)
            {
                authenticateResult = googleResult;
                provider = "google";
            }
            else
            {
                // Try GitHub
                var githubResult = await HttpContext.AuthenticateAsync(GitHubAuthenticationDefaults.AuthenticationScheme);
                if (githubResult.Succeeded)
                {
                    authenticateResult = githubResult;
                    provider = "github";
                }
            }

            if (authenticateResult == null || !authenticateResult.Succeeded || provider == null)
            {
                _logger.LogWarning("External auth failed | IP: {IpAddress}", ipAddress);
                return RedirectWithError("AUTH_FAILED", "External authentication failed", isMobile, returnUrl);
            }

            var claims = authenticateResult.Principal?.Claims.ToList();

            // Extract user info from claims
            var providerKey = claims?.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(providerKey))
            {
                return RedirectWithError("MISSING_PROVIDER_KEY", "Could not get provider user ID", isMobile, returnUrl);
            }

            var email = claims?.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
            var name = claims?.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;
            var avatarUrl = claims?.FirstOrDefault(c => c.Type == "urn:github:avatar")?.Value
                ?? claims?.FirstOrDefault(c => c.Type == "picture")?.Value;

            // Process external login
            var result = await _authService.ExternalLoginAsync(
                provider,
                providerKey,
                email,
                name,
                avatarUrl,
                ipAddress,
                deviceType,
                deviceName,
                deviceOs);

            _logger.LogInformation("External login success | Provider: {Provider} | UserId: {UserId} | IP: {IpAddress}",
                provider, result.User.Id, ipAddress);

            // Check if user has a password set
            var hasPassword = await _userManager.HasPasswordAsync(result.User);

            // Return tokens based on client type
            if (isMobile)
            {
                // Use the provided redirect URL (from Expo) or fall back to the configured scheme
                string deepLink;
                if (!string.IsNullOrEmpty(redirectUrl))
                {
                    // Use the redirect URL provided by the mobile app (e.g., exp://... for Expo Go)
                    var separator = redirectUrl.Contains('?') ? '&' : '?';
                    deepLink = $"{redirectUrl}{separator}accessToken={Uri.EscapeDataString(result.AccessToken)}" +
                        $"&refreshToken={Uri.EscapeDataString(result.RefreshToken)}" +
                        $"&expiresIn={result.ExpiresIn}" +
                        $"&userId={Uri.EscapeDataString(result.User.Id.ToString())}" +
                        $"&email={Uri.EscapeDataString(result.User.Email ?? "")}" +
                        $"&name={Uri.EscapeDataString(result.User.Name ?? "")}" +
                        $"&avatarUrl={Uri.EscapeDataString(result.User.AvatarUrl ?? "")}" +
                        $"&emailVerified={result.User.EmailConfirmed.ToString().ToLower()}" +
                        $"&hasPassword={hasPassword.ToString().ToLower()}";
                }
                else
                {
                    // Fall back to configured scheme
                    var mobileScheme = _configuration["OAuth:MobileCallbackScheme"] ?? "tymblok";
                    deepLink = $"{mobileScheme}://auth/callback" +
                        $"?accessToken={Uri.EscapeDataString(result.AccessToken)}" +
                        $"&refreshToken={Uri.EscapeDataString(result.RefreshToken)}" +
                        $"&expiresIn={result.ExpiresIn}" +
                        $"&userId={Uri.EscapeDataString(result.User.Id.ToString())}" +
                        $"&email={Uri.EscapeDataString(result.User.Email ?? "")}" +
                        $"&name={Uri.EscapeDataString(result.User.Name ?? "")}" +
                        $"&avatarUrl={Uri.EscapeDataString(result.User.AvatarUrl ?? "")}" +
                        $"&emailVerified={result.User.EmailConfirmed.ToString().ToLower()}" +
                        $"&hasPassword={hasPassword.ToString().ToLower()}";
                }
                return Redirect(deepLink);
            }
            else
            {
                // For web: redirect with tokens in URL fragment (more secure)
                var webCallbackUrl = returnUrl ?? _configuration["OAuth:WebCallbackUrl"] ?? "/";
                var webRedirectUrl = $"{webCallbackUrl}#access_token={Uri.EscapeDataString(result.AccessToken)}" +
                    $"&refresh_token={Uri.EscapeDataString(result.RefreshToken)}" +
                    $"&expires_in={result.ExpiresIn}";
                return Redirect(webRedirectUrl);
            }
        }
        catch (AuthException ex)
        {
            _logger.LogWarning("External login failed | Code: {Code} | IP: {IpAddress}", ex.Code, ipAddress);
            return RedirectWithError(ex.Code, ex.Message, isMobile, returnUrl);
        }
    }

    /// <summary>
    /// Unlink external provider from authenticated user account
    /// </summary>
    [HttpDelete("external/link/{provider}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UnlinkExternalProvider(string provider)
    {
        var userId = _currentUser.UserId;
        var ipAddress = GetIpAddress();

        try
        {
            await _authService.UnlinkExternalLoginAsync(userId, provider);

            _logger.LogInformation("External provider unlinked | Provider: {Provider} | UserId: {UserId} | IP: {IpAddress}",
                provider, userId, ipAddress);

            return Ok(WrapResponse(new MessageResponse($"{provider} account has been unlinked")));
        }
        catch (AuthException ex)
        {
            return BadRequest(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// Get linked external providers for authenticated user
    /// </summary>
    [HttpGet("external/providers")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [ProducesResponseType(typeof(ApiResponse<IList<string>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLinkedProviders()
    {
        var userId = _currentUser.UserId;
        var providers = await _authService.GetLinkedProvidersAsync(userId);
        return Ok(WrapResponse(providers));
    }

    /// <summary>
    /// Check if authenticated user has a password set
    /// </summary>
    [HttpGet("has-password")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> HasPassword()
    {
        var userId = _currentUser.UserId;
        var hasPassword = await _authService.HasPasswordAsync(userId);
        return Ok(WrapResponse(hasPassword));
    }

    /// <summary>
    /// Get all active sessions for authenticated user
    /// </summary>
    [HttpGet("sessions")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [ProducesResponseType(typeof(ApiResponse<SessionsResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSessions()
    {
        var userId = _currentUser.UserId;
        var sessions = await _authService.GetSessionsAsync(userId);

        var sessionDtos = sessions.Select(s => new SessionDto(
            s.Id,
            s.DeviceType,
            s.DeviceName,
            s.DeviceOs,
            MaskIpAddress(s.IpAddress),
            s.IsCurrent,
            s.LastActiveAt,
            s.CreatedAt
        )).ToList();

        return Ok(WrapResponse(new SessionsResponse(sessionDtos)));
    }

    /// <summary>
    /// Revoke a specific session
    /// </summary>
    [HttpDelete("sessions/{sessionId:guid}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeSession(Guid sessionId)
    {
        var userId = _currentUser.UserId;
        var ipAddress = GetIpAddress();

        try
        {
            await _authService.RevokeSessionAsync(userId, sessionId);
            _logger.LogInformation("Session revoked | SessionId: {SessionId} | UserId: {UserId} | IP: {IpAddress}",
                sessionId, userId, ipAddress);
            return Ok(WrapResponse(new MessageResponse("Session has been revoked")));
        }
        catch (AuthException ex) when (ex.Code == "SESSION_NOT_FOUND")
        {
            return NotFound(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// Revoke all sessions except the current one (logout all devices)
    /// </summary>
    [HttpDelete("sessions")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RevokeAllSessions([FromQuery] Guid? exceptSessionId = null)
    {
        var userId = _currentUser.UserId;
        var ipAddress = GetIpAddress();

        await _authService.RevokeAllSessionsAsync(userId, exceptSessionId);
        _logger.LogInformation("All sessions revoked | UserId: {UserId} | ExceptSession: {ExceptSession} | IP: {IpAddress}",
            userId, exceptSessionId, ipAddress);

        return Ok(WrapResponse(new MessageResponse("All other sessions have been revoked")));
    }

    private static string? MaskIpAddress(string? ipAddress)
    {
        if (string.IsNullOrEmpty(ipAddress)) return null;

        // Mask last octet for privacy: 192.168.1.100 -> 192.168.1.xxx
        var parts = ipAddress.Split('.');
        if (parts.Length == 4)
        {
            return $"{parts[0]}.{parts[1]}.{parts[2]}.xxx";
        }

        // For IPv6 or other formats, just show first part
        if (ipAddress.Length > 10)
        {
            return ipAddress.Substring(0, 10) + "...";
        }

        return ipAddress;
    }

    private IActionResult RedirectWithError(string code, string message, bool isMobile, string? returnUrl)
    {
        if (isMobile)
        {
            var mobileScheme = _configuration["OAuth:MobileCallbackScheme"] ?? "tymblok";
            return Redirect($"{mobileScheme}://auth/error?code={Uri.EscapeDataString(code)}&message={Uri.EscapeDataString(message)}");
        }
        else
        {
            var webCallbackUrl = returnUrl ?? _configuration["OAuth:WebCallbackUrl"] ?? "/";
            return Redirect($"{webCallbackUrl}?error={Uri.EscapeDataString(code)}&message={Uri.EscapeDataString(message)}");
        }
    }

    private static AuthResponse CreateAuthResponse(AuthResult result, IList<string> roles, bool hasPassword)
    {
        var userDto = MapToUserDto(result.User, roles, hasPassword);
        return new AuthResponse(result.AccessToken, result.RefreshToken, result.ExpiresIn, userDto);
    }

    private static UserDto MapToUserDto(ApplicationUser user, IList<string> roles, bool hasPassword)
    {
        return new UserDto(
            user.Id,
            user.Email ?? string.Empty,
            user.Name,
            user.AvatarUrl,
            user.Theme.ToString().ToLowerInvariant(),
            user.HighContrast,
            user.ReduceMotion,
            user.TextSize.ToString().ToLowerInvariant(),
            user.EmailConfirmed,
            hasPassword,
            roles,
            user.CreatedAt,
            user.Timezone,
            user.WorkingHoursStart.ToString("HH:mm"),
            user.WorkingHoursEnd.ToString("HH:mm"),
            user.LunchStart.ToString("HH:mm"),
            user.LunchDurationMinutes,
            user.NotificationBlockReminder,
            user.NotificationReminderMinutes,
            user.NotificationDailySummary
        );
    }

    private string? GetIpAddress()
    {
        if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
        {
            return forwardedFor.FirstOrDefault()?.Split(',').FirstOrDefault()?.Trim();
        }

        return HttpContext.Connection.RemoteIpAddress?.ToString();
    }

    private (string? deviceType, string? deviceName, string? deviceOs) GetDeviceInfo()
    {
        var userAgent = Request.Headers.UserAgent.FirstOrDefault() ?? "";

        // Determine device type
        string? deviceType = "desktop";
        if (userAgent.Contains("Mobile", StringComparison.OrdinalIgnoreCase) ||
            userAgent.Contains("Android", StringComparison.OrdinalIgnoreCase) ||
            userAgent.Contains("iPhone", StringComparison.OrdinalIgnoreCase) ||
            userAgent.Contains("iPad", StringComparison.OrdinalIgnoreCase))
        {
            deviceType = "mobile";
        }
        else if (userAgent.Contains("Tablet", StringComparison.OrdinalIgnoreCase))
        {
            deviceType = "tablet";
        }

        // Determine device OS
        string? deviceOs = null;
        if (userAgent.Contains("Windows", StringComparison.OrdinalIgnoreCase))
            deviceOs = "Windows";
        else if (userAgent.Contains("Mac OS", StringComparison.OrdinalIgnoreCase) || userAgent.Contains("Macintosh", StringComparison.OrdinalIgnoreCase))
            deviceOs = "macOS";
        else if (userAgent.Contains("iPhone", StringComparison.OrdinalIgnoreCase) || userAgent.Contains("iPad", StringComparison.OrdinalIgnoreCase))
            deviceOs = "iOS";
        else if (userAgent.Contains("Android", StringComparison.OrdinalIgnoreCase))
            deviceOs = "Android";
        else if (userAgent.Contains("Linux", StringComparison.OrdinalIgnoreCase))
            deviceOs = "Linux";

        // Determine device name (browser or app)
        string? deviceName = null;
        if (userAgent.Contains("Expo", StringComparison.OrdinalIgnoreCase) || userAgent.Contains("okhttp", StringComparison.OrdinalIgnoreCase))
            deviceName = "Tymblok Mobile App";
        else if (userAgent.Contains("Chrome", StringComparison.OrdinalIgnoreCase) && !userAgent.Contains("Edg", StringComparison.OrdinalIgnoreCase))
            deviceName = "Chrome";
        else if (userAgent.Contains("Firefox", StringComparison.OrdinalIgnoreCase))
            deviceName = "Firefox";
        else if (userAgent.Contains("Safari", StringComparison.OrdinalIgnoreCase) && !userAgent.Contains("Chrome", StringComparison.OrdinalIgnoreCase))
            deviceName = "Safari";
        else if (userAgent.Contains("Edg", StringComparison.OrdinalIgnoreCase))
            deviceName = "Edge";

        // Combine device name with OS if available
        if (deviceName != null && deviceOs != null)
        {
            deviceName = $"{deviceName} on {deviceOs}";
        }

        return (deviceType, deviceName, deviceOs);
    }
}
