using Microsoft.AspNetCore.SignalR;
using Tymblok.Api.Hubs;
using Tymblok.Core.Interfaces;

namespace Tymblok.Api.Services;

public class BlockNotifier : IBlockNotifier
{
    private readonly IHubContext<TymblokHub> _hub;

    public BlockNotifier(IHubContext<TymblokHub> hub)
    {
        _hub = hub;
    }

    public Task NotifyBlockUpdatedAsync(Guid userId, Guid blockId, string timerState, CancellationToken ct = default)
        => _hub.Clients.Group($"user:{userId}")
            .SendAsync("BlockUpdated", new { blockId, timerState }, cancellationToken: ct);
}
