namespace Tymblok.Core.Interfaces;

public interface IBlockNotifier
{
    Task NotifyBlockUpdatedAsync(Guid userId, Guid blockId, string timerState, CancellationToken ct = default);
}
