import type { CategoryDto } from './category';

export enum RecurrenceType {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly'
}

export enum TimerState {
  NotStarted = 'NotStarted',
  Running = 'Running',
  Paused = 'Paused',
  Completed = 'Completed'
}

export interface RecurrenceRuleDto {
  id: string;
  type: RecurrenceType;
  interval: number;
  daysOfWeek: string | null;
  endDate: string | null;
  maxOccurrences: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlockDto {
  id: string;
  title: string;
  subtitle: string | null;
  categoryId: string;
  category: CategoryDto;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isUrgent: boolean;
  isCompleted: boolean;
  progress: number;
  elapsedSeconds: number;
  sortOrder: number;
  externalId: string | null;
  externalUrl: string | null;
  createdAt: string;
  completedAt: string | null;
  // Timer
  timerState: TimerState;
  startedAt: string | null;
  pausedAt: string | null;
  resumedAt: string | null;
  // Recurrence
  isRecurring: boolean;
  recurrenceRuleId: string | null;
  recurrenceRule: RecurrenceRuleDto | null;
  recurrenceParentId: string | null;
}

export interface CreateBlockRequest {
  title: string;
  subtitle?: string | null;
  categoryId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  isUrgent?: boolean;
  externalId?: string | null;
  externalUrl?: string | null;
  // Recurrence
  isRecurring?: boolean;
  recurrenceType?: RecurrenceType | null;
  recurrenceInterval?: number;
  recurrenceDaysOfWeek?: string | null;
  recurrenceEndDate?: string | null;
  recurrenceMaxOccurrences?: number | null;
}

export interface UpdateBlockRequest {
  title?: string;
  subtitle?: string | null;
  categoryId?: string;
  date?: string;
  startTime?: string;
  durationMinutes?: number;
  isUrgent?: boolean;
  isCompleted?: boolean;
  progress?: number;
  sortOrder?: number;
}

export interface GetBlocksParams {
  date?: string;
  startDate?: string;
  endDate?: string;
}

export interface BlocksResponse {
  blocks: BlockDto[];
}
