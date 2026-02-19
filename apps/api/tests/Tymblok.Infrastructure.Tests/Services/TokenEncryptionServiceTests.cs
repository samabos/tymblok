using Microsoft.Extensions.Configuration;
using Tymblok.Infrastructure.Services;

namespace Tymblok.Infrastructure.Tests.Services;

public class TokenEncryptionServiceTests
{
    private readonly TokenEncryptionService _service;

    public TokenEncryptionServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Integrations:EncryptionKey"] = "test-encryption-key-at-least-32-characters-long"
            })
            .Build();

        _service = new TokenEncryptionService(config);
    }

    [Fact]
    public void Encrypt_Decrypt_RoundTrips_Successfully()
    {
        var plainText = "ghp_abc123def456xyz";

        var encrypted = _service.Encrypt(plainText);
        var decrypted = _service.Decrypt(encrypted);

        Assert.Equal(plainText, decrypted);
    }

    [Fact]
    public void Encrypt_ProducesDifferentCiphertext_ForSameInput()
    {
        var plainText = "same-token-value";

        var encrypted1 = _service.Encrypt(plainText);
        var encrypted2 = _service.Encrypt(plainText);

        // Different random IVs should produce different ciphertext
        Assert.NotEqual(encrypted1, encrypted2);

        // But both should decrypt to the same value
        Assert.Equal(plainText, _service.Decrypt(encrypted1));
        Assert.Equal(plainText, _service.Decrypt(encrypted2));
    }

    [Fact]
    public void Decrypt_Fails_WithWrongKey()
    {
        var plainText = "secret-token";
        var encrypted = _service.Encrypt(plainText);

        // Create a second service with a different key
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Integrations:EncryptionKey"] = "a-completely-different-encryption-key-here"
            })
            .Build();
        var otherService = new TokenEncryptionService(config);

        Assert.ThrowsAny<Exception>(() => otherService.Decrypt(encrypted));
    }

    [Fact]
    public void Encrypt_HandlesEmptyString()
    {
        var encrypted = _service.Encrypt("");
        var decrypted = _service.Decrypt(encrypted);

        Assert.Equal("", decrypted);
    }

    [Fact]
    public void Encrypt_HandlesLongTokens()
    {
        var longToken = new string('a', 2000);

        var encrypted = _service.Encrypt(longToken);
        var decrypted = _service.Decrypt(encrypted);

        Assert.Equal(longToken, decrypted);
    }
}
