namespace Tymblok.Infrastructure.Services;

public class GoogleCalendarSettings
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string IntegrationScopes { get; set; } = "openid email profile https://www.googleapis.com/auth/calendar.readonly";
}
