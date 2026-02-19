using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

public record OAuthStateData(Guid UserId, IntegrationProvider Provider, string? MobileRedirectUri);

public interface IOAuthStateService
{
    string GenerateState(Guid userId, IntegrationProvider provider, string? mobileRedirectUri = null);
    OAuthStateData? ValidateState(string state);
}
