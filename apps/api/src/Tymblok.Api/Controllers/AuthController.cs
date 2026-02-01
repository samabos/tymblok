using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Tymblok.Api.DTOs;
using Tymblok.Core.Entities;
using Tymblok.Core.Exceptions;
using Tymblok.Core.Interfaces;

namespace Tymblok.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService,
        UserManager<ApplicationUser> userManager,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _userManager = userManager;
        _logger = logger;
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
            var result = await _authService.RegisterAsync(request.Email, request.Password, request.Name, ipAddress);

            _logger.LogInformation("User registered | UserId: {UserId} | IP: {IpAddress}", result.User.Id, ipAddress);

            var roles = await _userManager.GetRolesAsync(result.User);
            var response = CreateAuthResponse(result, roles);
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
        try
        {
            var result = await _authService.LoginAsync(request.Email, request.Password, ipAddress);

            _logger.LogInformation("User logged in | UserId: {UserId} | IP: {IpAddress}", result.User.Id, ipAddress);

            var roles = await _userManager.GetRolesAsync(result.User);
            var response = CreateAuthResponse(result, roles);
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

    private static AuthResponse CreateAuthResponse(AuthResult result, IList<string> roles)
    {
        var userDto = MapToUserDto(result.User, roles);
        return new AuthResponse(result.AccessToken, result.RefreshToken, result.ExpiresIn, userDto);
    }

    private static UserDto MapToUserDto(ApplicationUser user, IList<string> roles)
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
            roles,
            user.CreatedAt
        );
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

    private string? GetIpAddress()
    {
        if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
        {
            return forwardedFor.FirstOrDefault()?.Split(',').FirstOrDefault()?.Trim();
        }

        return HttpContext.Connection.RemoteIpAddress?.ToString();
    }
}
