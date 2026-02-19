import type { BlockDto, InboxItemDto } from '@tymblok/api-client';
import type { InboxSource, TaskCardData, TimerStatus } from '@tymblok/ui';

export type { TaskCardData, TimerStatus };

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
    externalSource: block.externalSource,
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
  source: InboxSource;
  time: string;
  type: 'task' | 'update';
  sourceIcon: string;
}

export function mapInboxItemToData(item: InboxItemDto): InboxItemData {
  return {
    id: item.id,
    title: item.title,
    description: item.description || undefined,
    source: mapInboxSource(item.source),
    time: formatRelativeTime(item.createdAt),
    type: item.type === 'Task' ? 'task' : 'update',
    sourceIcon: getSourceIcon(item.source),
  };
}

function mapInboxSource(source: string): InboxSource {
  const sourceMap: Record<string, InboxSource> = {
    GitHub: 'github',
    Jira: 'jira',
    GoogleCalendar: 'calendar',
    Slack: 'slack',
    Manual: 'manual',
  };
  return sourceMap[source] || 'manual';
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
