namespace Tymblok.Core.Interfaces;

public interface IStatsService
{
    Task<StatsResult> GetStatsAsync(Guid userId, CancellationToken ct = default);
}

public record StatsResult(
    double ThisWeekHours,
    double? WeekChangePercent,
    int TasksDone,
    int? TasksDoneChange,
    double ThisMonthHours,
    double? MonthChangePercent,
    double AvgHoursPerDay,
    IList<DailyPoint> WeeklyChart,
    IList<CategoryPoint> CategoryBreakdown,
    int CurrentStreak,
    int BestStreak,
    int FocusScore
);

public record DailyPoint(string DayLabel, DateOnly Date, double Hours, int CompletedCount);
public record CategoryPoint(Guid Id, string Name, string Color, double Hours, int Percent);
