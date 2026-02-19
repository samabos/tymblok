using System.Collections.Concurrent;
using System.Security.Cryptography;
using Tymblok.Core.Entities;
using Tymblok.Core.Interfaces;

namespace Tymblok.Infrastructure.Services;

public class OAuthStateService : IOAuthStateService
{
    private readonly ConcurrentDictionary<string, (Guid UserId, IntegrationProvider Provider, string? MobileRedirectUri, DateTime ExpiresAt)> _states = new();

    public string GenerateState(Guid userId, IntegrationProvider provider, string? mobileRedirectUri = null)
    {
        CleanupExpired();

        var state = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var expiresAt = DateTime.UtcNow.AddMinutes(10);

        _states[state] = (userId, provider, mobileRedirectUri, expiresAt);
        return state;
    }

    public OAuthStateData? ValidateState(string state)
    {
        if (!_states.TryRemove(state, out var entry))
            return null;

        if (entry.ExpiresAt < DateTime.UtcNow)
            return null;

        return new OAuthStateData(entry.UserId, entry.Provider, entry.MobileRedirectUri);
    }

    private void CleanupExpired()
    {
        var now = DateTime.UtcNow;
        foreach (var kvp in _states)
        {
            if (kvp.Value.ExpiresAt < now)
            {
                _states.TryRemove(kvp.Key, out _);
            }
        }
    }
}
