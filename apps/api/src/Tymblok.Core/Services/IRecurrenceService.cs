using Tymblok.Core.Entities;

namespace Tymblok.Core.Services;

public interface IRecurrenceService
{
    /// <summary>
    /// Generates occurrences for a recurrence rule within a date range
    /// </summary>
    IEnumerable<DateOnly> GenerateOccurrences(
        RecurrenceRule rule,
        DateOnly startDate,
        DateOnly fromDate,
        DateOnly toDate);

    /// <summary>
    /// Generates the next N occurrences for a recurrence rule
    /// </summary>
    IEnumerable<DateOnly> GenerateNextOccurrences(
        RecurrenceRule rule,
        DateOnly startDate,
        int count);

    /// <summary>
    /// Checks if a date matches a recurrence rule
    /// </summary>
    bool IsOccurrenceDate(
        RecurrenceRule rule,
        DateOnly startDate,
        DateOnly dateToCheck);
}
