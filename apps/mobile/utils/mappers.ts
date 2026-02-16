import type { BlockDto, InboxItemDto } from '@tymblok/api-client';

// Map BlockDto to TaskCard component props
export type TimerStatus = 'NotStarted' | 'Running' | 'Paused' | 'Completed';

export interface TaskCardData {
  id: string;
  title: string;
  subtitle?: string;
  time: string;          // "9:00 AM"
  endTime: string;       // "10:00 AM"
  durationMinutes: number;
  type: 'github' | 'jira' | 'meeting' | 'focus';
  completed: boolean;
  urgent: boolean;
  isNow: boolean;        // Timer running OR current time within block
  timerState: TimerStatus; // Explicit timer state from backend
  elapsedSeconds: number; // Cumulative elapsed seconds from backend
  isRecurring?: boolean; // Is this a recurring task?
}

export function mapBlockToTaskCard(block: BlockDto): TaskCardData {
  return {
    id: block.id,
    title: block.title,
    subtitle: block.subtitle || undefined,
    time: formatTime(block.startTime),
    endTime: formatTime(block.endTime),
    durationMinutes: block.durationMinutes,
    type: mapCategoryToType(block.category.name),
    completed: block.isCompleted,
    urgent: block.isUrgent,
    isNow: determineIsNow(block),
    timerState: (block.timerState as TimerStatus) || 'NotStarted',
    elapsedSeconds: block.elapsedSeconds || 0,
    isRecurring: block.isRecurring,
  };
}

function formatTime(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function mapCategoryToType(categoryName: string): TaskCardData['type'] {
  const normalized = categoryName.toLowerCase();
  if (normalized.includes('github') || normalized.includes('code')) return 'github';
  if (normalized.includes('jira') || normalized.includes('ticket')) return 'jira';
  if (normalized.includes('meeting') || normalized.includes('calendar')) return 'meeting';
  return 'focus';
}

function determineIsNow(block: BlockDto): boolean {
  // Only live when the user has explicitly started the timer
  return block.timerState === 'Running';
}

// Map InboxItemDto to InboxItem component props
export interface InboxItemData {
  id: string;
  title: string;
  description?: string;
  source: string;
  type: 'task' | 'update';
  sourceIcon: string;
}

export function mapInboxItemToData(item: InboxItemDto): InboxItemData {
  return {
    id: item.id,
    title: item.title,
    description: item.description || undefined,
    source: item.source,
    type: item.type === 'Task' ? 'task' : 'update',
    sourceIcon: getSourceIcon(item.source),
  };
}

function getSourceIcon(source: string): string {
  const icons: Record<string, string> = {
    GitHub: 'logo-github',
    Jira: 'logo-atlassian',
    GoogleCalendar: 'calendar-outline',
    Slack: 'chatbubbles-outline',
    Manual: 'create-outline',
  };
  return icons[source] || 'document-outline';
}
