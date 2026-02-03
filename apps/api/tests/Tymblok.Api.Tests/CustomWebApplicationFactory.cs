using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

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
    }
}
