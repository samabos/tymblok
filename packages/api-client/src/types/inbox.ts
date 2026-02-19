import type { RecurrenceRuleDto, RecurrenceType } from './block';

export enum InboxSource {
  Manual = 'Manual',
  GitHub = 'GitHub',
  Jira = 'Jira',
  GoogleCalendar = 'GoogleCalendar',
  Slack = 'Slack',
}

export enum InboxItemType {
  Task = 'Task',
  Event = 'Event',
  Update = 'Update',
  Notification = 'Notification',
}

export enum InboxPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

export interface InboxItemDto {
  id: string;
  title: string;
  description: string | null;
  source: InboxSource;
  type: InboxItemType;
  priority: InboxPriority;
  externalId: string | null;
  externalUrl: string | null;
  isDismissed: boolean;
  isScheduled: boolean;
  scheduledBlockId: string | null;
  createdAt: string;
  dismissedAt: string | null;
  isRecurring: boolean;
  recurrenceRuleId: string | null;
  recurrenceRule: RecurrenceRuleDto | null;
}

export interface CreateInboxItemRequest {
  title: string;
  description?: string | null;
  priority: InboxPriority;
  integrationId?: string | null;
  externalId?: string | null;
  externalUrl?: string | null;
  isRecurring?: boolean;
  recurrenceType?: RecurrenceType | null;
  recurrenceInterval?: number;
  recurrenceDaysOfWeek?: string | null;
  recurrenceEndDate?: string | null;
  recurrenceMaxOccurrences?: number | null;
}

export interface UpdateInboxItemRequest {
  title?: string;
  description?: string | null;
  priority?: InboxPriority;
  isDismissed?: boolean;
}

export interface InboxItemsResponse {
  items: InboxItemDto[];
}
