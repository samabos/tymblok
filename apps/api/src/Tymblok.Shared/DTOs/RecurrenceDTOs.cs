using Tymblok.Core.Entities;

namespace Tymblok.Shared.DTOs;

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

public record CreateRecurrenceRuleRequest(
    RecurrenceType Type,
    int Interval = 1,
    string? DaysOfWeek = null,
    DateOnly? EndDate = null,
    int? MaxOccurrences = null
);

public record UpdateRecurrenceRuleRequest(
    RecurrenceType? Type = null,
    int? Interval = null,
    string? DaysOfWeek = null,
    DateOnly? EndDate = null,
    int? MaxOccurrences = null
);

public static class RecurrenceRuleExtensions
{
    public static RecurrenceRuleDto ToDto(this RecurrenceRule rule)
    {
        return new RecurrenceRuleDto(
            rule.Id,
            rule.Type,
            rule.Interval,
            rule.DaysOfWeek,
            rule.EndDate,
            rule.MaxOccurrences,
            rule.CreatedAt,
            rule.UpdatedAt
        );
    }
}
