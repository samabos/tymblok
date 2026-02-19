using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tymblok.Api.DTOs;
using Tymblok.Core.Entities;
using Tymblok.Core.Exceptions;
using Tymblok.Core.Interfaces;

namespace Tymblok.Api.Controllers;

[ApiController]
[Route("api/integrations")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class IntegrationsController : BaseApiController
{
    private readonly IIntegrationService _integrationService;
    private readonly ICurrentUser _currentUser;
    private readonly IConfiguration _configuration;
    private readonly ILogger<IntegrationsController> _logger;

    public IntegrationsController(
        IIntegrationService integrationService,
        ICurrentUser currentUser,
        IConfiguration configuration,
        ILogger<IntegrationsController> logger)
    {
        _integrationService = integrationService;
        _currentUser = currentUser;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// List all integrations for the current user
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IntegrationsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        var integrations = await _integrationService.GetAllAsync(userId, ct);

        var dtos = integrations.Select(i => new IntegrationDto(
            i.Id, i.Provider, i.ExternalUsername, i.ExternalAvatarUrl,
            i.LastSyncAt, i.LastSyncError, i.CreatedAt
        )).ToList();

        return Ok(WrapResponse(new IntegrationsResponse(dtos)));
    }

    /// <summary>
    /// Start OAuth flow to connect an integration.
    /// Returns an authUrl to open in a browser. The callback routes through the API.
    /// </summary>
    [HttpPost("{provider}/connect")]
    [ProducesResponseType(typeof(ApiResponse<ConnectIntegrationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Connect(
        IntegrationProvider provider,
        [FromQuery] string? redirectUri,
        CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;

        try
        {
            // Build a clean API callback URL (no query params) — must match what's registered in Google/GitHub
            var apiCallbackUrl = Url.Action(
                nameof(OAuthCallback), "Integrations",
                new { provider },
                Request.Scheme);

            // The mobile redirectUri is stored in the OAuth state, not in the redirect_uri
            var config = await _integrationService.ConnectAsync(userId, provider, apiCallbackUrl, redirectUri, ct);

            _logger.LogInformation("OAuth flow started | Provider: {Provider} | UserId: {UserId}",
                provider, userId);

            return Ok(WrapResponse(new ConnectIntegrationResponse(config.AuthUrl, config.State)));
        }
        catch (ConflictException ex)
        {
            return Conflict(CreateErrorResponse(ex.Code, ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// OAuth callback - Google/GitHub redirects here after user authorizes.
    /// Exchanges the code for tokens and redirects to the mobile app.
    /// </summary>
    [HttpGet("{provider}/oauth-callback")]
    [AllowAnonymous]
    public async Task<IActionResult> OAuthCallback(
        IntegrationProvider provider,
        [FromQuery] string? code,
        [FromQuery] string? state,
        [FromQuery] string? error = null,
        CancellationToken ct = default)
    {
        var mobileScheme = _configuration["OAuth:MobileCallbackScheme"] ?? "tymblok";
        var defaultRedirect = $"{mobileScheme}://integrations/callback";

        // Handle OAuth errors from the provider
        if (!string.IsNullOrEmpty(error) || string.IsNullOrEmpty(code) || string.IsNullOrEmpty(state))
        {
            var errorMsg = error ?? "Missing code or state parameter";
            _logger.LogWarning("OAuth callback error | Provider: {Provider} | Error: {Error}", provider, errorMsg);
            return Redirect($"{defaultRedirect}?error={Uri.EscapeDataString(errorMsg)}&provider={provider}");
        }

        try
        {
            // Validate state — this also consumes it (one-time use).
            // State contains userId, provider, and the mobile redirect URI.
            var stateData = _integrationService.ValidateOAuthState(state);
            if (stateData == null)
            {
                return Redirect($"{defaultRedirect}?error=Invalid+or+expired+state&provider={provider}");
            }

            var userId = stateData.UserId;
            var mobileRedirectUri = stateData.MobileRedirectUri ?? defaultRedirect;

            // Build the same clean redirect_uri that was sent to the provider
            var apiCallbackUrl = Url.Action(
                nameof(OAuthCallback), "Integrations",
                new { provider },
                Request.Scheme);

            // Pass null for state — we already consumed it above via ValidateOAuthState
            var result = await _integrationService.CallbackAsync(
                userId, provider, code, null, apiCallbackUrl, ct);

            _logger.LogInformation("Integration connected via OAuth callback | Provider: {Provider} | UserId: {UserId}",
                provider, userId);

            // Redirect back to the mobile app
            var sep = mobileRedirectUri.Contains('?') ? '&' : '?';
            return Redirect($"{mobileRedirectUri}{sep}success=true&provider={provider}");
        }
        catch (Exception ex) when (ex is ValidationException or ConflictException or IntegrationException)
        {
            _logger.LogWarning("OAuth callback failed | Provider: {Provider} | Error: {Error}", provider, ex.Message);
            return Redirect($"{defaultRedirect}?error={Uri.EscapeDataString(ex.Message)}&provider={provider}");
        }
    }

    /// <summary>
    /// Handle OAuth callback via POST (for mobile apps sending code directly)
    /// </summary>
    [HttpPost("{provider}/callback")]
    [ProducesResponseType(typeof(ApiResponse<IntegrationDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Callback(
        IntegrationProvider provider,
        [FromBody] IntegrationCallbackRequest request,
        CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        try
        {
            var result = await _integrationService.CallbackAsync(
                userId, provider, request.Code, request.State, request.RedirectUri, ct);

            _logger.LogInformation("Integration connected | Provider: {Provider} | UserId: {UserId}",
                provider, userId);

            var dto = new IntegrationDto(
                result.Id, result.Provider, result.ExternalUsername,
                result.ExternalAvatarUrl, result.LastSyncAt, result.LastSyncError, result.CreatedAt);

            return StatusCode(StatusCodes.Status201Created, WrapResponse(dto));
        }
        catch (ValidationException ex)
        {
            return BadRequest(CreateErrorResponse(ex.Code, ex.Message));
        }
        catch (ConflictException ex)
        {
            return Conflict(CreateErrorResponse(ex.Code, ex.Message));
        }
        catch (IntegrationException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// Disconnect an integration
    /// </summary>
    [HttpDelete("{provider}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Disconnect(IntegrationProvider provider, CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        try
        {
            await _integrationService.DisconnectAsync(userId, provider, ct);

            _logger.LogInformation("Integration disconnected | Provider: {Provider} | UserId: {UserId}",
                provider, userId);

            return NoContent();
        }
        catch (NotFoundException ex)
        {
            return NotFound(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// Manually trigger a sync for an integration
    /// </summary>
    [HttpPost("{provider}/sync")]
    [ProducesResponseType(typeof(ApiResponse<SyncResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status502BadGateway)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Sync(IntegrationProvider provider, CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        try
        {
            var result = await _integrationService.SyncAsync(userId, provider, ct);

            return Ok(WrapResponse(new SyncResponse(result.ItemsSynced, result.SyncedAt)));
        }
        catch (NotFoundException ex)
        {
            return NotFound(CreateErrorResponse(ex.Code, ex.Message));
        }
        catch (IntegrationException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// Sync all connected integrations for the current user.
    /// Server-side debounce: skips integrations synced in the last 5 minutes.
    /// </summary>
    [HttpPost("sync-all")]
    [ProducesResponseType(typeof(ApiResponse<SyncAllResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SyncAll(CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        var result = await _integrationService.SyncAllAsync(userId, ct: ct);
        return Ok(WrapResponse(new SyncAllResponse(result.TotalItemsSynced, result.IntegrationsSynced, result.SyncedAt)));
    }

}
