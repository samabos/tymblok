using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Tymblok.Api.DTOs;
using Tymblok.Core.Interfaces;

namespace Tymblok.Api.Controllers;

[ApiController]
[Route("api/waitlist")]
public class WaitlistController : BaseApiController
{
    private readonly IWaitlistService _waitlistService;
    private readonly ILogger<WaitlistController> _logger;

    public WaitlistController(IWaitlistService waitlistService, ILogger<WaitlistController> logger)
    {
        _waitlistService = waitlistService;
        _logger = logger;
    }

    [HttpPost]
    [EnableRateLimiting("waitlist")]
    [ProducesResponseType(typeof(ApiResponse<WaitlistResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Subscribe([FromBody] WaitlistRequest request, CancellationToken ct)
    {
        var (subscriber, alreadySubscribed) = await _waitlistService.SubscribeAsync(
            request.Email, request.Name, request.Source, ct);

        var message = alreadySubscribed
            ? "You're already on the waitlist!"
            : "You've been added to the waitlist. Check your email for confirmation.";

        var response = new WaitlistResponse(message, alreadySubscribed);

        return StatusCode(
            alreadySubscribed ? StatusCodes.Status200OK : StatusCodes.Status201Created,
            WrapResponse(response));
    }
}
