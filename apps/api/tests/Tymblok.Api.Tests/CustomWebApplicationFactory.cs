using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Tymblok.Core.Interfaces;

namespace Tymblok.Api.Tests;

/// <summary>
/// Custom WebApplicationFactory for integration tests.
/// Uses in-memory database and Testing environment.
/// JWT authentication is handled by Microsoft Identity - we don't override it.
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Use Testing environment which enables in-memory database
        // See: Program.cs useInMemoryDatabase: isTestEnvironment
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Replace email service with a no-op mock so tests never hit Resend
            var mockEmail = new Mock<IEmailService>();
            services.AddScoped(_ => mockEmail.Object);
        });
    }
}
