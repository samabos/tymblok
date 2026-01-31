using Moq;
using Tymblok.Core.Entities;
using Tymblok.Core.Interfaces;
using Tymblok.Core.Services;

namespace Tymblok.Core.Tests;

public class AuthServiceTests
{
    private readonly Mock<IAuthRepository> _repositoryMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        _repositoryMock = new Mock<IAuthRepository>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _tokenServiceMock = new Mock<ITokenService>();

        _authService = new AuthService(
            _repositoryMock.Object,
            _passwordHasherMock.Object,
            _tokenServiceMock.Object,
            refreshTokenExpiryDays: 7
        );
    }

    [Fact]
    public async Task RegisterAsync_WithValidData_ReturnsAuthResult()
    {
        // Arrange
        var email = "test@example.com";
        var password = "Password123!";
        var name = "Test User";
        var hashedPassword = "hashed_password";
        var tokens = new TokenResult("access_token", "refresh_token", 900);

        _repositoryMock.Setup(r => r.GetUserByEmailAsync(email))
            .ReturnsAsync((User?)null);
        _passwordHasherMock.Setup(p => p.Hash(password))
            .Returns(hashedPassword);
        _tokenServiceMock.Setup(t => t.GenerateTokens(It.IsAny<User>()))
            .Returns(tokens);

        // Act
        var result = await _authService.RegisterAsync(email, password, name);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(email, result.User.Email);
        Assert.Equal(name, result.User.Name);
        Assert.Equal(tokens.AccessToken, result.AccessToken);
        Assert.Equal(tokens.RefreshToken, result.RefreshToken);

        _repositoryMock.Verify(r => r.CreateUserAsync(It.Is<User>(u => u.Email == email && u.PasswordHash == hashedPassword)), Times.Once);
        _repositoryMock.Verify(r => r.CreateRefreshTokenAsync(It.IsAny<RefreshToken>()), Times.Once);
        _repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_WithExistingEmail_ThrowsConflictException()
    {
        // Arrange
        var email = "existing@example.com";
        var existingUser = new User { Email = email };

        _repositoryMock.Setup(r => r.GetUserByEmailAsync(email))
            .ReturnsAsync(existingUser);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<AuthException>(
            () => _authService.RegisterAsync(email, "password", "name")
        );

        Assert.Equal("CONFLICT", exception.Code);
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsAuthResult()
    {
        // Arrange
        var email = "test@example.com";
        var password = "Password123!";
        var hashedPassword = "hashed_password";
        var user = new User { Id = Guid.NewGuid(), Email = email, PasswordHash = hashedPassword, Name = "Test" };
        var tokens = new TokenResult("access_token", "refresh_token", 900);

        _repositoryMock.Setup(r => r.GetUserByEmailAsync(email))
            .ReturnsAsync(user);
        _passwordHasherMock.Setup(p => p.Verify(password, hashedPassword))
            .Returns(true);
        _tokenServiceMock.Setup(t => t.GenerateTokens(user))
            .Returns(tokens);

        // Act
        var result = await _authService.LoginAsync(email, password);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(user.Id, result.User.Id);
        Assert.Equal(tokens.AccessToken, result.AccessToken);
        Assert.NotNull(user.LastLoginAt);

        _repositoryMock.Verify(r => r.UpdateUserAsync(user), Times.Once);
        _repositoryMock.Verify(r => r.CreateRefreshTokenAsync(It.IsAny<RefreshToken>()), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidEmail_ThrowsAuthException()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetUserByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<AuthException>(
            () => _authService.LoginAsync("wrong@example.com", "password")
        );

        Assert.Equal("AUTH_INVALID_CREDENTIALS", exception.Code);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ThrowsAuthException()
    {
        // Arrange
        var user = new User { Email = "test@example.com", PasswordHash = "hashed" };

        _repositoryMock.Setup(r => r.GetUserByEmailAsync(user.Email))
            .ReturnsAsync(user);
        _passwordHasherMock.Setup(p => p.Verify(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(false);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<AuthException>(
            () => _authService.LoginAsync(user.Email, "wrong_password")
        );

        Assert.Equal("AUTH_INVALID_CREDENTIALS", exception.Code);
    }

    [Fact]
    public async Task RefreshTokenAsync_WithValidToken_ReturnsNewTokens()
    {
        // Arrange
        var user = new User { Id = Guid.NewGuid(), Email = "test@example.com", Name = "Test" };
        var oldToken = new RefreshToken
        {
            Token = "old_token",
            UserId = user.Id,
            User = user,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        var newTokens = new TokenResult("new_access", "new_refresh", 900);

        _repositoryMock.Setup(r => r.GetRefreshTokenAsync("old_token"))
            .ReturnsAsync(oldToken);
        _tokenServiceMock.Setup(t => t.GenerateTokens(user))
            .Returns(newTokens);

        // Act
        var result = await _authService.RefreshTokenAsync("old_token");

        // Assert
        Assert.Equal(newTokens.AccessToken, result.AccessToken);
        Assert.Equal(newTokens.RefreshToken, result.RefreshToken);
        Assert.NotNull(oldToken.RevokedAt);

        _repositoryMock.Verify(r => r.UpdateRefreshTokenAsync(oldToken), Times.Once);
        _repositoryMock.Verify(r => r.CreateRefreshTokenAsync(It.IsAny<RefreshToken>()), Times.Once);
    }

    [Fact]
    public async Task RefreshTokenAsync_WithInvalidToken_ThrowsAuthException()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetRefreshTokenAsync(It.IsAny<string>()))
            .ReturnsAsync((RefreshToken?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<AuthException>(
            () => _authService.RefreshTokenAsync("invalid_token")
        );

        Assert.Equal("AUTH_TOKEN_INVALID", exception.Code);
    }

    [Fact]
    public async Task RefreshTokenAsync_WithExpiredToken_ThrowsAuthException()
    {
        // Arrange
        var expiredToken = new RefreshToken
        {
            Token = "expired",
            ExpiresAt = DateTime.UtcNow.AddDays(-1), // Expired
            User = new User()
        };

        _repositoryMock.Setup(r => r.GetRefreshTokenAsync("expired"))
            .ReturnsAsync(expiredToken);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<AuthException>(
            () => _authService.RefreshTokenAsync("expired")
        );

        Assert.Equal("AUTH_REFRESH_EXPIRED", exception.Code);
    }
}
