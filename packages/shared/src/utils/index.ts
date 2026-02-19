import { format, parseISO, addMinutes, differenceInMinutes, startOfDay } from 'date-fns';
import type { Priority, ScheduledBlock, Task } from '../types';

// ============================================================================
// Date Utilities
// ============================================================================

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'h:mm a');
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'EEEE, MMMM d, yyyy');
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d');
}

export function getDateKey(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

export function getDurationMinutes(start: string, end: string): number {
  return differenceInMinutes(parseISO(end), parseISO(start));
}

export function addMinutesToDate(date: string | Date, minutes: number): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return addMinutes(d, minutes);
}

// ============================================================================
// Scheduling Utilities
// ============================================================================

export function calculateTaskScore(task: Task, now: Date = new Date()): number {
  let score = 0;

  // Priority base score
  const priorityScores: Record<Priority, number> = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25,
  };
  score += priorityScores[task.priority];

  // Source-specific scoring
  if (task.source === 'github_pr' && task.source_metadata) {
    const createdAt = task.created_at ? parseISO(task.created_at) : now;
    const ageHours = differenceInMinutes(now, createdAt) / 60;

    // PR staleness: +10 points per 24h
    score += Math.floor(ageHours / 24) * 10;

    // Large PRs get slight priority
    const linesChanged =
      (task.source_metadata.additions || 0) + (task.source_metadata.deletions || 0);
    if (linesChanged > 500) score += 5;
  }

  if (task.source === 'jira' && task.source_metadata?.sprint_end_date) {
    const sprintEnd = parseISO(task.source_metadata.sprint_end_date);
    const daysUntilEnd = differenceInMinutes(sprintEnd, now) / (60 * 24);

    // Sprint deadline proximity
    if (daysUntilEnd <= 1) score += 50;
    else if (daysUntilEnd <= 2) score += 30;
    else if (daysUntilEnd <= 3) score += 20;

    // Story points consideration
    if (task.source_metadata.story_points && task.source_metadata.story_points >= 5) {
      score += 10; // Larger items need early attention
    }
  }

  return score;
}

export function estimateTaskDuration(task: Task): number {
  // If task has explicit duration, use it
  if (task.duration_minutes > 0) {
    return task.duration_minutes;
  }

  // Estimate based on source
  if (task.source === 'github_pr' && task.source_metadata) {
    const linesChanged =
      (task.source_metadata.additions || 0) + (task.source_metadata.deletions || 0);
    // Base 10 min + 1 min per 50 lines
    return Math.min(120, 10 + Math.ceil(linesChanged / 50));
  }

  if (task.source === 'jira' && task.source_metadata?.story_points) {
    const pointsToMinutes: Record<number, number> = {
      1: 30,
      2: 60,
      3: 120,
      5: 240,
      8: 480,
    };
    return pointsToMinutes[task.source_metadata.story_points] || 60;
  }

  // Default 30 minutes
  return 30;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  duration_minutes: number;
}

export function findAvailableSlots(
  date: Date,
  existingBlocks: ScheduledBlock[],
  workingHoursStart: string,
  workingHoursEnd: string,
  lunchStart: string,
  lunchDurationMinutes: number
): TimeSlot[] {
  const dayStart = startOfDay(date);

  // Parse working hours
  const [startHour, startMin] = workingHoursStart.split(':').map(Number);
  const [endHour, endMin] = workingHoursEnd.split(':').map(Number);
  const [lunchHour, lunchMin] = lunchStart.split(':').map(Number);

  const workStart = new Date(dayStart);
  workStart.setHours(startHour, startMin, 0, 0);

  const workEnd = new Date(dayStart);
  workEnd.setHours(endHour, endMin, 0, 0);

  const lunchStartTime = new Date(dayStart);
  lunchStartTime.setHours(lunchHour, lunchMin, 0, 0);

  const lunchEndTime = addMinutes(lunchStartTime, lunchDurationMinutes);

  // Collect all busy periods
  const busyPeriods: Array<{ start: Date; end: Date }> = [
    { start: lunchStartTime, end: lunchEndTime },
  ];

  for (const block of existingBlocks) {
    busyPeriods.push({
      start: parseISO(block.start_time),
      end: parseISO(block.end_time),
    });
  }

  // Sort by start time
  busyPeriods.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Find gaps
  const slots: TimeSlot[] = [];
  let currentTime = workStart;

  for (const busy of busyPeriods) {
    if (busy.start > currentTime && busy.start <= workEnd) {
      const slotEnd = busy.start < workEnd ? busy.start : workEnd;
      const duration = differenceInMinutes(slotEnd, currentTime);
      if (duration >= 15) {
        slots.push({
          start: new Date(currentTime),
          end: slotEnd,
          duration_minutes: duration,
        });
      }
    }
    if (busy.end > currentTime) {
      currentTime = busy.end;
    }
  }

  // Check for slot after last busy period
  if (currentTime < workEnd) {
    const duration = differenceInMinutes(workEnd, currentTime);
    if (duration >= 15) {
      slots.push({
        start: new Date(currentTime),
        end: workEnd,
        duration_minutes: duration,
      });
    }
  }

  return slots;
}

// ============================================================================
// Validation
// ============================================================================

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

// ============================================================================
// Constants
// ============================================================================

export const PRIORITY_COLORS: Record<Priority, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#F59E0B',
  low: '#22C55E',
};

export const SOURCE_COLORS = {
  manual: '#6366F1',
  github_pr: '#24292E',
  github_issue: '#24292E',
  jira: '#0052CC',
  google_calendar: '#4285F4',
} as const;

export const CATEGORY_PRESETS = [
  { name: 'Work', color: '#6366F1', icon: 'briefcase' },
  { name: 'Personal', color: '#8B5CF6', icon: 'user' },
  { name: 'Health', color: '#10B981', icon: 'heart' },
  { name: 'Admin', color: '#F59E0B', icon: 'folder' },
] as const;
