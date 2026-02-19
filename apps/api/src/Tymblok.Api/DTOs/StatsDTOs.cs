namespace Tymblok.Api.DTOs;

public record StatsResponse(
    StatsWeekSummary WeekSummary,
    StatsMonthSummary MonthSummary,
    IList<StatsDailyPoint> WeeklyChart,
    IList<StatsCategoryBreakdown> CategoryBreakdown,
    StatsStreak Streak,
    int FocusScore
);

public record StatsWeekSummary(
    double ThisWeekHours,
    double? WeekChangePercent,
    int TasksDone,
    int? TasksDoneChange
);

public record StatsMonthSummary(
    double ThisMonthHours,
    double? MonthChangePercent,
    double AvgHoursPerDay
);

public record StatsDailyPoint(
    string DayLabel,
    DateOnly Date,
    double Hours,
    int CompletedCount
);

public record StatsCategoryBreakdown(
    Guid CategoryId,
    string CategoryName,
    string CategoryColor,
    double Hours,
    int Percent
);

public record StatsStreak(
    int CurrentStreak,
    int BestStreak
);
