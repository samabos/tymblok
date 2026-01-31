namespace Tymblok.Core.Entities;

public class UserStats : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public DateOnly Date { get; set; }

    public int TotalMinutes { get; set; } = 0;
    public int BlocksCompleted { get; set; } = 0;
    public int BlocksCreated { get; set; } = 0;

    // Category breakdown (JSON)
    public string? CategoryBreakdown { get; set; }
}
