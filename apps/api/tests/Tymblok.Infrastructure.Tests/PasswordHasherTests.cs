using Tymblok.Infrastructure.Services;

namespace Tymblok.Infrastructure.Tests;

public class PasswordHasherTests
{
    private readonly PasswordHasher _passwordHasher;

    public PasswordHasherTests()
    {
        _passwordHasher = new PasswordHasher();
    }

    [Fact]
    public void Hash_ReturnsNonEmptyHash()
    {
        // Arrange
        var password = "MySecurePassword123!";

        // Act
        var hash = _passwordHasher.Hash(password);

        // Assert
        Assert.NotEmpty(hash);
        Assert.NotEqual(password, hash);
    }

    [Fact]
    public void Hash_ReturnsDifferentHashForSamePassword()
    {
        // Arrange
        var password = "MySecurePassword123!";

        // Act
        var hash1 = _passwordHasher.Hash(password);
        var hash2 = _passwordHasher.Hash(password);

        // Assert - BCrypt uses random salt, so hashes should be different
        Assert.NotEqual(hash1, hash2);
    }

    [Fact]
    public void Verify_WithCorrectPassword_ReturnsTrue()
    {
        // Arrange
        var password = "MySecurePassword123!";
        var hash = _passwordHasher.Hash(password);

        // Act
        var result = _passwordHasher.Verify(password, hash);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void Verify_WithIncorrectPassword_ReturnsFalse()
    {
        // Arrange
        var password = "MySecurePassword123!";
        var hash = _passwordHasher.Hash(password);

        // Act
        var result = _passwordHasher.Verify("WrongPassword!", hash);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void Verify_IsCaseSensitive()
    {
        // Arrange
        var password = "MySecurePassword123!";
        var hash = _passwordHasher.Hash(password);

        // Act
        var result = _passwordHasher.Verify("mysecurepassword123!", hash);

        // Assert
        Assert.False(result);
    }
}
