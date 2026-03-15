using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Tymblok.Api.DTOs;
using Tymblok.Core.Entities;
using Tymblok.Core.Exceptions;
using Tymblok.Core.Interfaces;
using Tymblok.Infrastructure.Data;

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
    private readonly TymblokDbContext _context;

    public IntegrationsController(
        IIntegrationService integrationService,
        ICurrentUser currentUser,
        IConfiguration configuration,
        ILogger<IntegrationsController> logger,
        TymblokDbContext context)
    {
        _integrationService = integrationService;
        _currentUser = currentUser;
        _configuration = configuration;
        _logger = logger;
        _context = context;
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
            i.Id, i.Provider, i.Name, i.ExternalUsername, i.ExternalAvatarUrl,
            i.LastSyncAt, i.LastSyncError, i.CreatedAt
        )).ToList();

        return Ok(WrapResponse(new IntegrationsResponse(dtos)));
    }

    /// <summary>
    /// Start OAuth flow to connect an integration.
    /// Returns an authUrl to open in a browser. The callback routes through the API.
    /// Supports multiple integrations per provider (e.g. multiple GitHub accounts).
    /// </summary>
    [HttpPost("{provider}/connect")]
    [ProducesResponseType(typeof(ApiResponse<ConnectIntegrationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Connect(
        IntegrationProvider provider,
        [FromQuery] string? redirectUri,
        [FromBody] ConnectIntegrationRequest? request = null,
        CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;

        try
        {
            var apiCallbackUrl = BuildOAuthCallbackUrl(provider);

            // The mobile redirectUri is stored in the OAuth state, not in the redirect_uri
            var config = await _integrationService.ConnectAsync(userId, provider, request?.Name, apiCallbackUrl, redirectUri, ct);

            _logger.LogInformation("OAuth flow started | Provider: {Provider} | UserId: {UserId} | CallbackUrl: {CallbackUrl}",
                provider, userId, apiCallbackUrl);

            return Ok(WrapResponse(new ConnectIntegrationResponse(config.AuthUrl, config.State)));
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
        var mobileRedirectUri = defaultRedirect;

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
            // State contains userId, provider, the mobile redirect URI, and optional name.
            var stateData = _integrationService.ValidateOAuthState(state);
            if (stateData == null)
            {
                return Redirect($"{defaultRedirect}?error=Invalid+or+expired+state&provider={provider}");
            }

            var userId = stateData.UserId;
            mobileRedirectUri = stateData.MobileRedirectUri ?? defaultRedirect;

            var apiCallbackUrl = BuildOAuthCallbackUrl(provider);

            // Pass null for state — we already consumed it above via ValidateOAuthState
            // Name flows through from the state data
            var result = await _integrationService.CallbackAsync(
                userId, provider, stateData.Name, code, null, apiCallbackUrl, ct);

            _logger.LogInformation(
                "Integration connected via OAuth callback | Provider: {Provider} | UserId: {UserId} | CallbackUrl: {CallbackUrl} | RedirectTo: {RedirectTo}",
                provider, userId, apiCallbackUrl, mobileRedirectUri);

            // Redirect back to the mobile app with the new integration ID
            var sep = mobileRedirectUri.Contains('?') ? '&' : '?';
            return Redirect($"{mobileRedirectUri}{sep}success=true&provider={provider}&integrationId={result.Id}");
        }
        catch (Exception ex) when (ex is ValidationException or ConflictException or IntegrationException)
        {
            _logger.LogWarning("OAuth callback failed | Provider: {Provider} | Error: {Error}", provider, ex.Message);
            var sep = mobileRedirectUri.Contains('?') ? '&' : '?';
            return Redirect($"{mobileRedirectUri}{sep}error={Uri.EscapeDataString(ex.Message)}&provider={provider}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during OAuth callback | Provider: {Provider}", provider);
            var sep = mobileRedirectUri.Contains('?') ? '&' : '?';
            return Redirect($"{mobileRedirectUri}{sep}error={Uri.EscapeDataString("An unexpected error occurred. Please try again.")}&provider={provider}");
        }
    }

    /// <summary>
    /// Handle OAuth callback via POST (for mobile apps sending code directly)
    /// </summary>
    [HttpPost("{provider}/callback")]
    [ProducesResponseType(typeof(ApiResponse<IntegrationDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
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
                userId, provider, request.Name, request.Code, request.State, request.RedirectUri, ct);

            _logger.LogInformation("Integration connected | Provider: {Provider} | UserId: {UserId}",
                provider, userId);

            var dto = new IntegrationDto(
                result.Id, result.Provider, result.Name, result.ExternalUsername,
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
    /// Disconnect an integration by ID
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Disconnect(Guid id, CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        try
        {
            await _integrationService.DisconnectAsync(userId, id, ct);

            _logger.LogInformation("Integration disconnected | Id: {Id} | UserId: {UserId}", id, userId);

            return NoContent();
        }
        catch (NotFoundException ex)
        {
            return NotFound(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// Rename an integration
    /// </summary>
    [HttpPatch("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<IntegrationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Rename(Guid id, [FromBody] RenameIntegrationRequest request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        try
        {
            var result = await _integrationService.RenameAsync(userId, id, request.Name, ct);

            var dto = new IntegrationDto(
                result.Id, result.Provider, result.Name, result.ExternalUsername,
                result.ExternalAvatarUrl, result.LastSyncAt, result.LastSyncError, result.CreatedAt);

            return Ok(WrapResponse(dto));
        }
        catch (NotFoundException ex)
        {
            return NotFound(CreateErrorResponse(ex.Code, ex.Message));
        }
    }

    /// <summary>
    /// Manually trigger a sync for an integration by ID
    /// </summary>
    [HttpPost("{id:guid}/sync")]
    [ProducesResponseType(typeof(ApiResponse<SyncResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status502BadGateway)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Sync(Guid id, CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        try
        {
            var result = await _integrationService.SyncAsync(userId, id, ct);

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

    /// <summary>
    /// Sync GitHub PRs from a VS Code extension into the user's inbox.
    /// Deduplicates by ExternalId (e.g. "github:owner/repo#123").
    /// </summary>
    [HttpPost("vscode/sync-prs")]
    [ProducesResponseType(typeof(ApiResponse<SyncPRsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SyncPRs(
        [FromBody] SyncPRsRequest request,
        CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        int created = 0, updated = 0;

        foreach (var pr in request.PullRequests)
        {
            var existing = await _context.InboxItems
                .FirstOrDefaultAsync(
                    i => i.UserId == userId && i.ExternalId == pr.ExternalId, ct);

            if (existing != null)
            {
                existing.Title = pr.Title;
                existing.Description = pr.Subtitle;
                existing.ExternalUrl = pr.Url;
                updated++;
            }
            else
            {
                Enum.TryParse<InboxPriority>(pr.Priority, true, out var priority);

                _context.InboxItems.Add(new InboxItem
                {
                    UserId = userId,
                    Title = pr.Title,
                    Description = pr.Subtitle,
                    Source = InboxSource.GitHub,
                    Type = InboxItemType.Task,
                    Priority = priority,
                    ExternalId = pr.ExternalId,
                    ExternalUrl = pr.Url,
                });
                created++;
            }
        }

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation(
            "VS Code PR sync: {Created} created, {Updated} updated for user {UserId}",
            created, updated, userId);

        return Ok(WrapResponse(new SyncPRsResponse(created, updated)));
    }

    /// <summary>
    /// Builds a deterministic OAuth callback URL.
    /// Uses Api:BaseUrl config if set (recommended for production behind reverse proxies),
    /// otherwise falls back to the current request's scheme and host.
    /// </summary>
    private string BuildOAuthCallbackUrl(IntegrationProvider provider)
    {
        var baseUrl = _configuration["Api:BaseUrl"];
        if (string.IsNullOrEmpty(baseUrl))
        {
            baseUrl = $"{Request.Scheme}://{Request.Host}";
        }

        return $"{baseUrl.TrimEnd('/')}/api/integrations/{provider}/oauth-callback";
    }

}
