using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

public record TokenResult(string AccessToken, string RefreshToken, int ExpiresIn);

public interface ITokenService
{
    TokenResult GenerateTokens(ApplicationUser user, IList<string>? roles = null);
    Guid? ValidateAccessToken(string token);
    string GenerateRefreshToken();
}
