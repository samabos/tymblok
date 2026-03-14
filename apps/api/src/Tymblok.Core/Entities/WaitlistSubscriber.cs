namespace Tymblok.Core.Entities;

public class WaitlistSubscriber : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Source { get; set; }
    public DateTime SubscribedAt { get; set; } = DateTime.UtcNow;
    public bool IsConfirmed { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? UnsubscribedAt { get; set; }
}
