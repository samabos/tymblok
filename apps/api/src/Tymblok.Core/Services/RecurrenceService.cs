using Tymblok.Core.Entities;

namespace Tymblok.Core.Services;

public class RecurrenceService : IRecurrenceService
{
    public IEnumerable<DateOnly> GenerateOccurrences(
        RecurrenceRule rule,
        DateOnly startDate,
        DateOnly fromDate,
        DateOnly toDate)
    {
        var occurrences = new List<DateOnly>();
        var currentDate = startDate;
        var occurrenceCount = 0;

        // Ensure we don't go beyond 2 years to prevent infinite loops
        var maxDate = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(2));
        if (toDate > maxDate) toDate = maxDate;

        while (currentDate <= toDate)
        {
            // Check if we've exceeded max occurrences
            if (rule.MaxOccurrences.HasValue && occurrenceCount >= rule.MaxOccurrences.Value)
                break;

            // Check if we've exceeded end date
            if (rule.EndDate.HasValue && currentDate > rule.EndDate.Value)
                break;

            // Check if this date is within the requested range and matches the rule
            if (currentDate >= fromDate && IsOccurrenceDate(rule, startDate, currentDate))
            {
                occurrences.Add(currentDate);
                occurrenceCount++;
            }

            // Move to next potential occurrence
            currentDate = GetNextDate(rule, currentDate);
        }

        return occurrences;
    }

    public IEnumerable<DateOnly> GenerateNextOccurrences(
        RecurrenceRule rule,
        DateOnly startDate,
        int count)
    {
        var occurrences = new List<DateOnly>();
        var currentDate = startDate;
        var occurrenceCount = 0;

        // Safety limit
        var iterations = 0;
        const int maxIterations = 1000;

        while (occurrences.Count < count && iterations < maxIterations)
        {
            iterations++;

            // Check if we've exceeded max occurrences from rule
            if (rule.MaxOccurrences.HasValue && occurrenceCount >= rule.MaxOccurrences.Value)
                break;

            // Check if we've exceeded end date
            if (rule.EndDate.HasValue && currentDate > rule.EndDate.Value)
                break;

            if (IsOccurrenceDate(rule, startDate, currentDate))
            {
                occurrences.Add(currentDate);
                occurrenceCount++;
            }

            currentDate = GetNextDate(rule, currentDate);
        }

        return occurrences;
    }

    public bool IsOccurrenceDate(
        RecurrenceRule rule,
        DateOnly startDate,
        DateOnly dateToCheck)
    {
        if (dateToCheck < startDate)
            return false;

        if (rule.EndDate.HasValue && dateToCheck > rule.EndDate.Value)
            return false;

        return rule.Type switch
        {
            RecurrenceType.Daily => IsDailyOccurrence(rule, startDate, dateToCheck),
            RecurrenceType.Weekly => IsWeeklyOccurrence(rule, startDate, dateToCheck),
            RecurrenceType.Monthly => IsMonthlyOccurrence(rule, startDate, dateToCheck),
            _ => false
        };
    }

    private static bool IsDailyOccurrence(RecurrenceRule rule, DateOnly startDate, DateOnly dateToCheck)
    {
        var daysDiff = dateToCheck.DayNumber - startDate.DayNumber;
        return daysDiff % rule.Interval == 0;
    }

    private static bool IsWeeklyOccurrence(RecurrenceRule rule, DateOnly startDate, DateOnly dateToCheck)
    {
        // Check if the day of week matches
        if (!string.IsNullOrEmpty(rule.DaysOfWeek))
        {
            var allowedDays = rule.DaysOfWeek
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(int.Parse)
                .ToList();

            var dayOfWeek = (int)dateToCheck.DayOfWeek;
            if (!allowedDays.Contains(dayOfWeek))
                return false;
        }

        // Check if the week interval matches
        var weeksDiff = (dateToCheck.DayNumber - startDate.DayNumber) / 7;
        return weeksDiff % rule.Interval == 0;
    }

    private static bool IsMonthlyOccurrence(RecurrenceRule rule, DateOnly startDate, DateOnly dateToCheck)
    {
        // Check if the day of month matches
        if (dateToCheck.Day != startDate.Day)
            return false;

        // Calculate months difference
        var monthsDiff = (dateToCheck.Year - startDate.Year) * 12 + (dateToCheck.Month - startDate.Month);
        return monthsDiff % rule.Interval == 0;
    }

    private static DateOnly GetNextDate(RecurrenceRule rule, DateOnly currentDate)
    {
        return rule.Type switch
        {
            RecurrenceType.Daily => currentDate.AddDays(rule.Interval),
            RecurrenceType.Weekly => currentDate.AddDays(7 * rule.Interval),
            RecurrenceType.Monthly => currentDate.AddMonths(rule.Interval),
            _ => currentDate.AddDays(1) // Fallback
        };
    }
}
