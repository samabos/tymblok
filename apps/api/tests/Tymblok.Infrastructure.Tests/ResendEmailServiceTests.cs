using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Tymblok.Infrastructure.Email;

namespace Tymblok.Infrastructure.Tests;

/// <summary>
/// Live integration test for Resend email service.
/// Requires a valid API key and verified domain.
/// Run manually: dotnet test --filter "FullyQualifiedName~ResendEmailServiceTests"
/// </summary>
public class ResendEmailServiceTests
{
    private const string TestRecipient = "samaborukoje@gmail.com";

    private static ResendEmailService CreateService()
    {
        var settings = Options.Create(new EmailSettings
        {
            ApiKey = Environment.GetEnvironmentVariable("RESEND_API_KEY") ?? "set-RESEND_API_KEY-env-var",
            ApiBaseUrl = "https://api.resend.com/",
            FromEmail = "noreply@tymblok.com",
            FromName = "Tymblok",
            AppBaseUrl = "https://tymblok.com"
        });

        var logger = LoggerFactory
            .Create(b => b.AddConsole())
            .CreateLogger<ResendEmailService>();

        var httpClient = new HttpClient();
        return new ResendEmailService(httpClient, settings, logger);
    }

    [Fact(Skip = "Live email test — run manually with: dotnet test --filter SendWaitlistConfirmation_ShouldSendEmail")]
    public async Task SendWaitlistConfirmation_ShouldSendEmail()
    {
        var service = CreateService();

        await service.SendWaitlistConfirmationAsync(TestRecipient, "Seun");

        // If no exception, the email was accepted by Resend API.
        // Check your inbox for the email.
        Assert.True(true);
    }
}
