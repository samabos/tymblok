using Microsoft.Extensions.Options;
using Tymblok.Core.Entities;
using Tymblok.Infrastructure.Services;

namespace Tymblok.Infrastructure.Tests;

public class TokenServiceTests
{
    private readonly TokenService _tokenService;
    private readonly JwtSettings _settings;

    public TokenServiceTests()
    {
        _settings = new JwtSettings
        {
            Secret = "ThisIsAVeryLongSecretKeyForTestingPurposes123!",
            Issuer = "TymblokTest",
            Audience = "TymblokTestAudience",
            ExpiryMinutes = 15
        };

        _tokenService = new TokenService(Options.Create(_settings));
    }

    [Fact]
    public void GenerateTokens_ReturnsValidTokenResult()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            Name = "Test User"
        };

        // Act
        var result = _tokenService.GenerateTokens(user);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result.AccessToken);
        Assert.NotEmpty(result.RefreshToken);
        Assert.Equal(_settings.ExpiryMinutes * 60, result.ExpiresIn);
    }

    [Fact]
    public void GenerateTokens_AccessTokenIsValidJwt()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            Name = "Test User"
        };

        // Act
        var result = _tokenService.GenerateTokens(user);

        // Assert - JWT has 3 parts separated by dots
        var parts = result.AccessToken.Split('.');
        Assert.Equal(3, parts.Length);
    }

    [Fact]
    public void ValidateAccessToken_WithValidToken_ReturnsUserId()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@example.com",
            Name = "Test User"
        };

        var tokens = _tokenService.GenerateTokens(user);

        // Act
        var result = _tokenService.ValidateAccessToken(tokens.AccessToken);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.Value);
    }

    [Fact]
    public void ValidateAccessToken_WithInvalidToken_ReturnsNull()
    {
        // Act
        var result = _tokenService.ValidateAccessToken("invalid.token.here");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void ValidateAccessToken_WithEmptyToken_ReturnsNull()
    {
        // Act
        var result = _tokenService.ValidateAccessToken("");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void GenerateRefreshToken_ReturnsNonEmptyString()
    {
        // Act
        var token = _tokenService.GenerateRefreshToken();

        // Assert
        Assert.NotEmpty(token);
    }

    [Fact]
    public void GenerateRefreshToken_ReturnsDifferentTokensEachTime()
    {
        // Act
        var token1 = _tokenService.GenerateRefreshToken();
        var token2 = _tokenService.GenerateRefreshToken();

        // Assert
        Assert.NotEqual(token1, token2);
    }
}
