export interface UpdateSettingsRequest {
  timezone?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  lunchStart?: string;
  lunchDurationMinutes?: number;
  notificationBlockReminder?: boolean;
  notificationReminderMinutes?: number;
  notificationDailySummary?: boolean;
}

export interface UserSettingsDto {
  timezone: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  lunchStart: string;
  lunchDurationMinutes: number;
  notificationBlockReminder: boolean;
  notificationReminderMinutes: number;
  notificationDailySummary: boolean;
}
