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

    public AuthController(IAuthService authService)
    {
        _authService = authService;
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

            var response = CreateAuthResponse(result);
            return StatusCode(StatusCodes.Status201Created, WrapResponse(response));
        }
        catch (AuthException ex) when (ex.Code == "CONFLICT")
        {
            return Conflict(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var ipAddress = GetIpAddress();
            var result = await _authService.LoginAsync(request.Email, request.Password, ipAddress);

            var response = CreateAuthResponse(result);
            return Ok(WrapResponse(response));
        }
        catch (AuthException ex) when (ex.Code == "AUTH_INVALID_CREDENTIALS")
        {
            return Unauthorized(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ApiResponse<RefreshResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
    {
        try
        {
            var ipAddress = GetIpAddress();
            var result = await _authService.RefreshTokenAsync(request.RefreshToken, ipAddress);

            var response = new RefreshResponse(result.AccessToken, result.RefreshToken, result.ExpiresIn);
            return Ok(WrapResponse(response));
        }
        catch (AuthException ex)
        {
            return Unauthorized(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    private static AuthResponse CreateAuthResponse(AuthResult result)
    {
        var userDto = MapToUserDto(result.User);
        return new AuthResponse(result.AccessToken, result.RefreshToken, result.ExpiresIn, userDto);
    }

    private static UserDto MapToUserDto(User user)
    {
        return new UserDto(
            user.Id,
            user.Email,
            user.Name,
            user.AvatarUrl,
            user.Theme.ToString().ToLowerInvariant(),
            user.HighContrast,
            user.ReduceMotion,
            user.TextSize.ToString().ToLowerInvariant(),
            user.EmailVerified,
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
