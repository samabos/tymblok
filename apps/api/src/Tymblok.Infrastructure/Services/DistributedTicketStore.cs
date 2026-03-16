using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.Caching.Distributed;

namespace Tymblok.Infrastructure.Services;

/// <summary>
/// Stores OAuth authentication tickets in a distributed cache (Redis).
/// This ensures SignOutAsync reliably invalidates tickets regardless of whether
/// the browser processes Set-Cookie headers (e.g., when redirecting to custom schemes).
/// Works across multiple app instances since tickets are stored in Redis, not in-memory.
/// </summary>
public class DistributedTicketStore : ITicketStore
{
    private readonly IDistributedCache _cache;
    private readonly TicketSerializer _serializer = TicketSerializer.Default;
    private const string KeyPrefix = "OAuthTicket:";

    public DistributedTicketStore(IDistributedCache cache)
    {
        _cache = cache;
    }

    public async Task<string> StoreAsync(AuthenticationTicket ticket)
    {
        var key = Guid.NewGuid().ToString();
        var data = _serializer.Serialize(ticket);
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpiration = ticket.Properties.ExpiresUtc ?? DateTimeOffset.UtcNow.AddMinutes(5)
        };
        await _cache.SetAsync(KeyPrefix + key, data, options);
        return key;
    }

    public async Task RenewAsync(string key, AuthenticationTicket ticket)
    {
        var data = _serializer.Serialize(ticket);
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpiration = ticket.Properties.ExpiresUtc ?? DateTimeOffset.UtcNow.AddMinutes(5)
        };
        await _cache.SetAsync(KeyPrefix + key, data, options);
    }

    public async Task<AuthenticationTicket?> RetrieveAsync(string key)
    {
        var data = await _cache.GetAsync(KeyPrefix + key);
        return data == null ? null : _serializer.Deserialize(data);
    }

    public async Task RemoveAsync(string key)
    {
        await _cache.RemoveAsync(KeyPrefix + key);
    }
}
