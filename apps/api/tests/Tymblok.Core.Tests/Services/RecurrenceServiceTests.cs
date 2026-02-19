using Tymblok.Core.Entities;
using Tymblok.Core.Services;

namespace Tymblok.Core.Tests.Services;

public class RecurrenceServiceTests
{
    private readonly RecurrenceService _service;

    public RecurrenceServiceTests()
    {
        _service = new RecurrenceService();
    }

    [Fact]
    public void GenerateOccurrences_DailyRecurrence_GeneratesCorrectDates()
    {
        // Arrange
        var rule = new RecurrenceRule
        {
            Type = RecurrenceType.Daily,
            Interval = 1
        };
        var startDate = new DateOnly(2026, 2, 16);
        var fromDate = new DateOnly(2026, 2, 16);
        var toDate = new DateOnly(2026, 2, 20);

        // Act
        var occurrences = _service.GenerateOccurrences(rule, startDate, fromDate, toDate).ToList();

        // Assert
        Assert.Equal(5, occurrences.Count); // 16, 17, 18, 19, 20
        Assert.Equal(new DateOnly(2026, 2, 16), occurrences[0]);
        Assert.Equal(new DateOnly(2026, 2, 20), occurrences[4]);
    }

    [Fact]
    public void GenerateOccurrences_DailyWithInterval2_GeneratesEveryOtherDay()
    {
        // Arrange
        var rule = new RecurrenceRule
        {
            Type = RecurrenceType.Daily,
            Interval = 2
        };
        var startDate = new DateOnly(2026, 2, 16);
        var fromDate = new DateOnly(2026, 2, 16);
        var toDate = new DateOnly(2026, 2, 24);

        // Act
        var occurrences = _service.GenerateOccurrences(rule, startDate, fromDate, toDate).ToList();

        // Assert
        Assert.Equal(5, occurrences.Count); // 16, 18, 20, 22, 24
        Assert.Equal(new DateOnly(2026, 2, 16), occurrences[0]);
        Assert.Equal(new DateOnly(2026, 2, 18), occurrences[1]);
        Assert.Equal(new DateOnly(2026, 2, 24), occurrences[4]);
    }

    [Fact]
    public void GenerateOccurrences_WeeklyRecurrence_GeneratesWeeklyDates()
    {
        // Arrange
        var rule = new RecurrenceRule
        {
            Type = RecurrenceType.Weekly,
            Interval = 1,
            DaysOfWeek = "0" // Sunday
        };
        var startDate = new DateOnly(2026, 2, 15); // Sunday
        var fromDate = new DateOnly(2026, 2, 15);
        var toDate = new DateOnly(2026, 3, 15);

        // Act
        var occurrences = _service.GenerateOccurrences(rule, startDate, fromDate, toDate).ToList();

        // Assert
        Assert.Equal(5, occurrences.Count); // 4 Sundays in range
        Assert.All(occurrences, date => Assert.Equal(DayOfWeek.Sunday, date.DayOfWeek));
    }

    [Fact]
    public void GenerateOccurrences_MonthlyRecurrence_GeneratesSameDayEachMonth()
    {
        // Arrange
        var rule = new RecurrenceRule
        {
            Type = RecurrenceType.Monthly,
            Interval = 1
        };
        var startDate = new DateOnly(2026, 2, 16);
        var fromDate = new DateOnly(2026, 2, 16);
        var toDate = new DateOnly(2026, 5, 16);

        // Act
        var occurrences = _service.GenerateOccurrences(rule, startDate, fromDate, toDate).ToList();

        // Assert
        Assert.Equal(4, occurrences.Count); // Feb 16, Mar 16, Apr 16, May 16
        Assert.All(occurrences, date => Assert.Equal(16, date.Day));
    }

    [Fact]
    public void GenerateOccurrences_WithEndDate_StopsAtEndDate()
    {
        // Arrange
        var rule = new RecurrenceRule
        {
            Type = RecurrenceType.Daily,
            Interval = 1,
            EndDate = new DateOnly(2026, 2, 18)
        };
        var startDate = new DateOnly(2026, 2, 16);
        var fromDate = new DateOnly(2026, 2, 16);
        var toDate = new DateOnly(2026, 2, 25);

        // Act
        var occurrences = _service.GenerateOccurrences(rule, startDate, fromDate, toDate).ToList();

        // Assert
        Assert.Equal(3, occurrences.Count); // 16, 17, 18 (stops at end date)
        Assert.Equal(new DateOnly(2026, 2, 18), occurrences.Last());
    }

    [Fact]
    public void GenerateOccurrences_WithMaxOccurrences_StopsAtMaxCount()
    {
        // Arrange
        var rule = new RecurrenceRule
        {
            Type = RecurrenceType.Daily,
            Interval = 1,
            MaxOccurrences = 3
        };
        var startDate = new DateOnly(2026, 2, 16);
        var fromDate = new DateOnly(2026, 2, 16);
        var toDate = new DateOnly(2026, 2, 25);

        // Act
        var occurrences = _service.GenerateOccurrences(rule, startDate, fromDate, toDate).ToList();

        // Assert
        Assert.Equal(3, occurrences.Count);
    }

    [Fact]
    public void IsOccurrenceDate_DailyRecurrence_ReturnsTrueForValidDate()
    {
        // Arrange
        var rule = new RecurrenceRule
        {
            Type = RecurrenceType.Daily,
            Interval = 1
        };
        var startDate = new DateOnly(2026, 2, 16);
        var checkDate = new DateOnly(2026, 2, 20);

        // Act
        var result = _service.IsOccurrenceDate(rule, startDate, checkDate);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsOccurrenceDate_DailyWithInterval2_ReturnsFalseForOddDay()
    {
        // Arrange
        var rule = new RecurrenceRule
        {
            Type = RecurrenceType.Daily,
            Interval = 2
        };
        var startDate = new DateOnly(2026, 2, 16);
        var checkDate = new DateOnly(2026, 2, 17); // Odd day

        // Act
        var result = _service.IsOccurrenceDate(rule, startDate, checkDate);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsOccurrenceDate_BeforeStartDate_ReturnsFalse()
    {
        // Arrange
        var rule = new RecurrenceRule
        {
            Type = RecurrenceType.Daily,
            Interval = 1
        };
        var startDate = new DateOnly(2026, 2, 16);
        var checkDate = new DateOnly(2026, 2, 15);

        // Act
        var result = _service.IsOccurrenceDate(rule, startDate, checkDate);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void GenerateNextOccurrences_GeneratesCorrectCount()
    {
        // Arrange
        var rule = new RecurrenceRule
        {
            Type = RecurrenceType.Daily,
            Interval = 1
        };
        var startDate = new DateOnly(2026, 2, 16);

        // Act
        var occurrences = _service.GenerateNextOccurrences(rule, startDate, 5).ToList();

        // Assert
        Assert.Equal(5, occurrences.Count);
        Assert.Equal(new DateOnly(2026, 2, 16), occurrences[0]);
        Assert.Equal(new DateOnly(2026, 2, 20), occurrences[4]);
    }
}
