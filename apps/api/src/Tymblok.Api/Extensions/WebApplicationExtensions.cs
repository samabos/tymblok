using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Serilog;
using Tymblok.Api.Middleware;

namespace Tymblok.Api.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication ConfigurePipeline(this WebApplication app)
    {
        // Handle forwarded headers from reverse proxies (ngrok, load balancers, etc.)
        // This must be early in the pipeline to set the correct scheme/host
        var forwardedHeadersOptions = new ForwardedHeadersOptions
        {
            ForwardedHeaders = ForwardedHeaders.XForwardedFor |
                               ForwardedHeaders.XForwardedProto |
                               ForwardedHeaders.XForwardedHost
        };
        // Clear the default restrictions to trust all proxies (for development with ngrok)
        forwardedHeadersOptions.KnownIPNetworks.Clear();
        forwardedHeadersOptions.KnownProxies.Clear();
        app.UseForwardedHeaders(forwardedHeadersOptions);

        // Global exception handling (must be first)
        app.UseGlobalExceptionHandler();

        // Serilog request logging
        app.UseSerilogRequestLogging(options =>
        {
            options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000}ms";
        });

        // Development-only middleware
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(options =>
            {
                options.SwaggerEndpoint("/swagger/v1/swagger.json", "Tymblok API v1");
            });
        }

        // Security & routing
        app.UseHttpsRedirection();
        app.UseCors("AllowAll");

        // Authentication & Authorization
        app.UseAuthentication();
        app.UseAuthorization();

        // Health checks endpoint
        app.MapHealthChecks("/health", new HealthCheckOptions
        {
            ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
        });

        // Controllers
        app.MapControllers();

        return app;
    }
}
