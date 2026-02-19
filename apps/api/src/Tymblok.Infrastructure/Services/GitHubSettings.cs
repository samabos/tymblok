namespace Tymblok.Infrastructure.Services;

public class GitHubSettings
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string IntegrationScopes { get; set; } = "read:user,notifications";
}
