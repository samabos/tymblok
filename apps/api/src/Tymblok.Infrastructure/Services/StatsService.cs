using Microsoft.EntityFrameworkCore;
using Tymblok.Core.Interfaces;
using Tymblok.Infrastructure.Data;

namespace Tymblok.Infrastructure.Services;

public class StatsService : IStatsService
{
    private readonly TymblokDbContext _context;

    public StatsService(TymblokDbContext context)
    {
        _context = context;
    }

    public async Task<StatsResult> GetStatsAsync(Guid userId, CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var thisMonday = GetMonday(today);
        var prevMonday = thisMonday.AddDays(-7);
        var thisSunday = thisMonday.AddDays(6);
        var prevSunday = prevMonday.AddDays(6);

        // Q1: 14 days of blocks (current + previous week) with category info
        var twoWeekBlocks = await _context.TimeBlocks
            .AsNoTracking()
            .Where(b => b.UserId == userId
                     && b.Date >= prevMonday
                     && b.Date <= thisSunday)
            .Select(b => new
            {
                b.Date,
                b.ElapsedSeconds,
                b.IsCompleted,
                b.CategoryId,
                CategoryName = b.Category.Name,
                CategoryColor = b.Category.Color,
            })
            .ToListAsync(ct);

        // Q2: Current + previous month blocks for month summary
        var firstOfMonth = new DateOnly(today.Year, today.Month, 1);
        var daysInMonth = today.Day;
        var prevMonthStart = firstOfMonth.AddMonths(-1);
        var prevMonthSameEnd = prevMonthStart.AddDays(daysInMonth - 1);

        var monthBlocks = await _context.TimeBlocks
            .AsNoTracking()
            .Where(b => b.UserId == userId
                     && b.Date >= prevMonthStart
                     && b.Date <= today)
            .Select(b => new { b.Date, b.ElapsedSeconds })
            .ToListAsync(ct);

        // Q3: Distinct dates with completed blocks (for streak)
        var completedDates = await _context.TimeBlocks
            .AsNoTracking()
            .Where(b => b.UserId == userId && b.IsCompleted)
            .Select(b => b.Date)
            .Distinct()
            .ToListAsync(ct);

        // --- In-memory aggregation ---

        var thisWeekData = twoWeekBlocks.Where(b => b.Date >= thisMonday && b.Date <= thisSunday).ToList();
        var prevWeekData = twoWeekBlocks.Where(b => b.Date >= prevMonday && b.Date <= prevSunday).ToList();

        // Week summary
        double thisWeekHours = Math.Round(thisWeekData.Sum(b => b.ElapsedSeconds) / 3600.0, 1);
        int tasksDone = thisWeekData.Count(b => b.IsCompleted);

        double prevWeekHours = prevWeekData.Sum(b => b.ElapsedSeconds) / 3600.0;
        int prevTasksDone = prevWeekData.Count(b => b.IsCompleted);

        double? weekChangePercent = prevWeekHours > 0
            ? Math.Round((thisWeekHours - prevWeekHours) / prevWeekHours * 100, 1)
            : null;

        int? tasksDoneChange = prevWeekData.Count > 0
            ? tasksDone - prevTasksDone
            : null;

        // Month summary
        double thisMonthHours = Math.Round(
            monthBlocks.Where(b => b.Date >= firstOfMonth).Sum(b => b.ElapsedSeconds) / 3600.0, 1);

        double prevMonthHours = monthBlocks
            .Where(b => b.Date >= prevMonthStart && b.Date <= prevMonthSameEnd)
            .Sum(b => b.ElapsedSeconds) / 3600.0;

        double? monthChangePercent = prevMonthHours > 0
            ? Math.Round((thisMonthHours - prevMonthHours) / prevMonthHours * 100, 1)
            : null;

        int daysElapsedThisWeek = today.DayOfWeek == DayOfWeek.Sunday
            ? 7
            : (int)today.DayOfWeek; // Monday=1 .. Saturday=6
        daysElapsedThisWeek = Math.Max(1, daysElapsedThisWeek);

        double avgHoursPerDay = Math.Round(thisWeekHours / daysElapsedThisWeek, 1);

        // Weekly chart (Mon-Sun)
        string[] dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        var weeklyChart = new List<DailyPoint>(7);

        for (int i = 0; i < 7; i++)
        {
            var date = thisMonday.AddDays(i);
            var dayData = thisWeekData.Where(b => b.Date == date).ToList();
            weeklyChart.Add(new DailyPoint(
                dayLabels[i],
                date,
                Math.Round(dayData.Sum(b => b.ElapsedSeconds) / 3600.0, 2),
                dayData.Count(b => b.IsCompleted)
            ));
        }

        // Category breakdown
        var categoryBreakdown = ComputeCategoryBreakdown(thisWeekData);

        // Streak
        var (currentStreak, bestStreak) = ComputeStreaks(completedDates, today);

        // Focus score
        int totalBlocksThisWeek = thisWeekData.Count;
        int completedThisWeek = thisWeekData.Count(b => b.IsCompleted);
        int focusScore = totalBlocksThisWeek > 0
            ? (int)Math.Round((double)completedThisWeek / totalBlocksThisWeek * 100)
            : 0;

        return new StatsResult(
            thisWeekHours,
            weekChangePercent,
            tasksDone,
            tasksDoneChange,
            thisMonthHours,
            monthChangePercent,
            avgHoursPerDay,
            weeklyChart,
            categoryBreakdown,
            currentStreak,
            bestStreak,
            focusScore
        );
    }

    private static DateOnly GetMonday(DateOnly date)
    {
        int daysFromMonday = date.DayOfWeek == DayOfWeek.Sunday ? 6 : (int)date.DayOfWeek - 1;
        return date.AddDays(-daysFromMonday);
    }

    private static IList<CategoryPoint> ComputeCategoryBreakdown<T>(List<T> weekData)
        where T : class
    {
        // Use dynamic projection since we receive anonymous types
        var items = weekData.Select(b =>
        {
            dynamic d = b;
            return new
            {
                CategoryId = (Guid)d.CategoryId,
                CategoryName = (string)d.CategoryName,
                CategoryColor = (string)d.CategoryColor,
                ElapsedSeconds = (int)d.ElapsedSeconds,
            };
        }).ToList();

        var groups = items
            .GroupBy(b => new { b.CategoryId, b.CategoryName, b.CategoryColor })
            .Select(g => new
            {
                g.Key.CategoryId,
                g.Key.CategoryName,
                g.Key.CategoryColor,
                Hours = Math.Round(g.Sum(b => b.ElapsedSeconds) / 3600.0, 2),
            })
            .OrderByDescending(g => g.Hours)
            .ToList();

        double totalHours = groups.Sum(g => g.Hours);

        if (totalHours == 0)
        {
            return groups.Select(g => new CategoryPoint(
                g.CategoryId, g.CategoryName, g.CategoryColor, 0, 0)).ToList();
        }

        // Largest-remainder rounding so percents sum to exactly 100
        var withFloor = groups.Select(g =>
        {
            double rawPercent = g.Hours / totalHours * 100.0;
            return new
            {
                g.CategoryId,
                g.CategoryName,
                g.CategoryColor,
                g.Hours,
                RawPercent = rawPercent,
                FloorPercent = (int)rawPercent,
            };
        }).ToList();

        int remainder = 100 - withFloor.Sum(g => g.FloorPercent);

        return withFloor
            .OrderByDescending(g => g.RawPercent - g.FloorPercent)
            .Select((g, idx) => new CategoryPoint(
                g.CategoryId,
                g.CategoryName,
                g.CategoryColor,
                g.Hours,
                g.FloorPercent + (idx < remainder ? 1 : 0)
            ))
            .OrderByDescending(g => g.Hours)
            .ToList();
    }

    private static (int CurrentStreak, int BestStreak) ComputeStreaks(List<DateOnly> completedDates, DateOnly today)
    {
        if (completedDates.Count == 0)
            return (0, 0);

        var dateSet = completedDates.ToHashSet();

        // Current streak: walk backwards from today
        int currentStreak = 0;
        var checkDay = today;
        while (dateSet.Contains(checkDay))
        {
            currentStreak++;
            checkDay = checkDay.AddDays(-1);
        }

        // Best streak: linear scan of sorted dates
        var sortedDates = completedDates.Order().ToList();
        int bestStreak = 0;
        int runStreak = 0;

        for (int i = 0; i < sortedDates.Count; i++)
        {
            if (i == 0 || sortedDates[i] == sortedDates[i - 1].AddDays(1))
            {
                runStreak++;
            }
            else
            {
                bestStreak = Math.Max(bestStreak, runStreak);
                runStreak = 1;
            }
        }
        bestStreak = Math.Max(bestStreak, runStreak);

        return (currentStreak, bestStreak);
    }
}
