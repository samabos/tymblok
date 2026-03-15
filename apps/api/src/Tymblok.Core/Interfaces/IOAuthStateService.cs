using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

public record OAuthStateData(Guid UserId, IntegrationProvider Provider, string? MobileRedirectUri, string? Name = null);

public interface IOAuthStateService
{
    string GenerateState(Guid userId, IntegrationProvider provider, string? mobileRedirectUri = null, string? name = null);
    OAuthStateData? ValidateState(string state);
}
