using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Tymblok.Core.Interfaces;

namespace Tymblok.Infrastructure.Services;

public class TokenEncryptionService : ITokenEncryptionService
{
    private readonly byte[] _key;

    public TokenEncryptionService(IConfiguration configuration)
    {
        var keyString = configuration["Integrations:EncryptionKey"]
            ?? throw new InvalidOperationException("Integrations:EncryptionKey is not configured");

        _key = SHA256.HashData(Encoding.UTF8.GetBytes(keyString));
    }

    public string Encrypt(string plainText)
    {
        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var nonce = new byte[12];
        RandomNumberGenerator.Fill(nonce);

        var cipherBytes = new byte[plainBytes.Length];
        var tag = new byte[16];

        using var aes = new AesGcm(_key, 16);
        aes.Encrypt(nonce, plainBytes, cipherBytes, tag);

        // Format: nonce (12) + tag (16) + ciphertext
        var result = new byte[nonce.Length + tag.Length + cipherBytes.Length];
        Buffer.BlockCopy(nonce, 0, result, 0, nonce.Length);
        Buffer.BlockCopy(tag, 0, result, nonce.Length, tag.Length);
        Buffer.BlockCopy(cipherBytes, 0, result, nonce.Length + tag.Length, cipherBytes.Length);

        return Convert.ToBase64String(result);
    }

    public string Decrypt(string cipherText)
    {
        var data = Convert.FromBase64String(cipherText);

        var nonce = new byte[12];
        var tag = new byte[16];
        var cipherBytes = new byte[data.Length - 12 - 16];

        Buffer.BlockCopy(data, 0, nonce, 0, 12);
        Buffer.BlockCopy(data, 12, tag, 0, 16);
        Buffer.BlockCopy(data, 28, cipherBytes, 0, cipherBytes.Length);

        var plainBytes = new byte[cipherBytes.Length];

        using var aes = new AesGcm(_key, 16);
        aes.Decrypt(nonce, cipherBytes, tag, plainBytes);

        return Encoding.UTF8.GetString(plainBytes);
    }
}
