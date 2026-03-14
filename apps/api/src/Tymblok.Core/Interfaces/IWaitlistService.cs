using Tymblok.Core.Entities;

namespace Tymblok.Core.Interfaces;

public interface IWaitlistService
{
    Task<(WaitlistSubscriber Subscriber, bool AlreadySubscribed)> SubscribeAsync(
        string email, string? name, string? source, CancellationToken ct = default);
}
