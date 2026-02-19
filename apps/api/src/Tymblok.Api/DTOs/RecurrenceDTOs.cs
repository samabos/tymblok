using Tymblok.Core.Entities;

namespace Tymblok.Api.DTOs;

public record RecurrenceRuleDto(
    Guid Id,
    RecurrenceType Type,
    int Interval,
    string? DaysOfWeek,
    DateOnly? EndDate,
    int? MaxOccurrences,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
