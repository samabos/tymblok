using System.ComponentModel.DataAnnotations;
using Tymblok.Core.Entities;

namespace Tymblok.Api.DTOs;

public record CreateInboxItemRequest(
    [Required][MinLength(1)][MaxLength(200)] string Title,
    [MaxLength(2000)] string? Description,
    InboxPriority Priority = InboxPriority.Medium,
    Guid? IntegrationId = null,
    string? ExternalId = null,
    string? ExternalUrl = null,
    bool IsRecurring = false,
    RecurrenceType? RecurrenceType = null,
    int RecurrenceInterval = 1,
    string? RecurrenceDaysOfWeek = null,
    DateOnly? RecurrenceEndDate = null,
    int? RecurrenceMaxOccurrences = null
);

public record UpdateInboxItemRequest(
    [Required][MinLength(1)][MaxLength(200)] string Title,
    [MaxLength(2000)] string? Description,
    InboxPriority? Priority = null,
    bool? IsDismissed = null
);

public record InboxItemDto(
    Guid Id,
    string Title,
    string? Description,
    InboxSource Source,
    InboxItemType Type,
    InboxPriority Priority,
    string? ExternalId,
    string? ExternalUrl,
    bool IsDismissed,
    bool IsScheduled,
    Guid? ScheduledBlockId,
    DateTime CreatedAt,
    DateTime? DismissedAt,
    bool IsRecurring,
    Guid? RecurrenceRuleId,
    RecurrenceRuleDto? RecurrenceRule
);

public record InboxItemsResponse(
    IList<InboxItemDto> Items
);
