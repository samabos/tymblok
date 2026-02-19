using Microsoft.AspNetCore.Mvc;
using Tymblok.Api.DTOs;

namespace Tymblok.Api.Controllers;

[ApiController]
public abstract class BaseApiController : ControllerBase
{
    protected ApiResponse<T> WrapResponse<T>(T data)
    {
        return new ApiResponse<T>(
            data,
            new ApiMeta(DateTime.UtcNow.ToString("o"), HttpContext.TraceIdentifier)
        );
    }

    protected ApiError CreateErrorResponse(string code, string message)
    {
        return new ApiError(
            new ErrorDetails(code, message),
            new ApiMeta(DateTime.UtcNow.ToString("o"), HttpContext.TraceIdentifier)
        );
    }
}
