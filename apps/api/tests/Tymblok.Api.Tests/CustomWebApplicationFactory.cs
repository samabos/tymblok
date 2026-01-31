using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace Tymblok.Api.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "ThisIsAVeryLongSecretKeyForTestingPurposes123!",
                ["Jwt:Issuer"] = "TymblokTest",
                ["Jwt:Audience"] = "TymblokTestAudience",
                ["Jwt:ExpiryMinutes"] = "15",
                ["Jwt:RefreshTokenExpiryDays"] = "7"
            });
        });

        builder.UseEnvironment("Testing");
    }
}
