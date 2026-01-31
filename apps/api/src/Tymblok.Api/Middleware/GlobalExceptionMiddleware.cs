using System.Net;
using System.Text.Json;
using Tymblok.Api.DTOs;

namespace Tymblok.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            // Log full error details for debugging (server-side only)
            _logger.LogError(ex,
                "Unhandled exception | TraceId: {TraceId} | Path: {Path} | Method: {Method}",
                context.TraceIdentifier,
                context.Request.Path,
                context.Request.Method);

            // Return user-friendly message without exposing internal details
            await WriteErrorResponseAsync(context);
        }
    }

    private static async Task WriteErrorResponseAsync(HttpContext context)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        // User-friendly message - no PII, stack traces, or internal details
        var response = new ApiError(
            new ErrorDetails("INTERNAL_ERROR", "Something went wrong. Please try again later."),
            new ApiMeta(DateTime.UtcNow.ToString("o"), context.TraceIdentifier)
        );

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }
}

public static class GlobalExceptionMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
    {
        return app.UseMiddleware<GlobalExceptionMiddleware>();
    }
}
