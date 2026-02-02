// ============================================================================
// Tymblok Shared Types
// ============================================================================

// User & Auth
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  email_verified?: boolean;
  timezone: string;
  working_hours_start: string;
  working_hours_end: string;
  lunch_start: string;
  lunch_duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface OAuthConnection {
  id: string;
  provider: OAuthProvider;
  provider_user_id: string;
  connected_at: string;
}

export type OAuthProvider = 'google' | 'github' | 'jira';

// Categories
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  is_default: boolean;
  sort_order: number;
}

// Tasks
export interface Task {
  id: string;
  title: string;
  notes: string | null;
  duration_minutes: number;
  category: Category | null;
  source: TaskSource;
  source_id: string | null;
  source_url: string | null;
  source_metadata: TaskSourceMetadata | null;
  priority: Priority;
  is_recurring: boolean;
  recurrence_rule: RecurrenceRule | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskSource = 'manual' | 'github_pr' | 'github_issue' | 'jira';
export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface RecurrenceRule {
  type: RecurrenceType;
  interval: number;
  days_of_week: number[];
  end_date: string | null;
  exceptions: string[];
}

export type RecurrenceType = 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom';

export interface TaskSourceMetadata {
  // GitHub PR
  pr_number?: number;
  repo_name?: string;
  author?: string;
  author_avatar?: string;
  additions?: number;
  deletions?: number;
  files_changed?: number;
  ci_status?: 'pending' | 'success' | 'failure';
  review_comments?: number;
  // GitHub Issue
  issue_number?: number;
  labels?: string[];
  // Jira
  ticket_key?: string;
  issue_type?: string;
  status?: string;
  sprint_name?: string;
  sprint_end_date?: string;
  story_points?: number;
}

// Scheduled Blocks
export interface ScheduledBlock {
  id: string;
  task_id: string | null;
  title: string;
  start_time: string;
  end_time: string;
  actual_start_time: string | null;
  actual_end_time: string | null;
  status: BlockStatus;
  source: BlockSource;
  external_event_id: string | null;
  color: string;
  notes: string | null;
}

export type BlockStatus = 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'moved';
export type BlockSource = 'tymblok' | 'google_calendar';

// Calendar Events (from Google)
export interface CalendarEvent {
  id: string;
  external_id: string;
  calendar_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  location: string | null;
  attendees: Attendee[];
  color: string;
  status: EventStatus;
}

export interface Attendee {
  email: string;
  name: string | null;
  response_status: 'accepted' | 'declined' | 'tentative' | 'needsAction';
}

export type EventStatus = 'confirmed' | 'tentative' | 'cancelled';

// Schedule Score
export interface ScheduleScore {
  overall: number;
  focus_time_score: number;
  priority_coverage: number;
  context_switch_score: number;
  buffer_time_score: number;
}

// User Preferences
export interface UserPreferences {
  focus_time_preference: 'morning' | 'afternoon' | 'flexible';
  min_focus_block_minutes: number;
  enable_auto_schedule: boolean;
  enable_batching: boolean;
  batch_pr_reviews: boolean;
  pr_review_time_preference: 'morning' | 'afternoon' | 'flexible';
  notification_daily_plan: boolean;
  notification_daily_plan_time: string;
  notification_end_of_day: boolean;
  notification_end_of_day_time: string;
  theme: 'light' | 'dark' | 'system';
  default_task_duration_minutes: number;
  week_start_day: number;
}

// API Request Types
export interface CreateTaskRequest {
  title: string;
  notes?: string;
  duration_minutes?: number;
  category_id?: string;
  priority?: Priority;
  is_recurring?: boolean;
  recurrence_rule?: RecurrenceRule;
}

export interface UpdateTaskRequest {
  title?: string;
  notes?: string;
  duration_minutes?: number;
  category_id?: string;
  priority?: Priority;
  is_completed?: boolean;
  recurrence_rule?: RecurrenceRule;
}

export interface CreateBlockRequest {
  task_id?: string;
  title?: string;
  start_time: string;
  end_time: string;
  color?: string;
  notes?: string;
  sync_to_calendar?: boolean;
}

export interface UpdateBlockRequest {
  start_time?: string;
  end_time?: string;
  status?: BlockStatus;
  notes?: string;
}

export interface AutoPlanRequest {
  date: string;
  task_ids?: string[];
  respect_existing?: boolean;
}

export interface AutoPlanResponse {
  proposed_blocks: ScheduledBlock[];
  score: ScheduleScore;
  warnings: string[];
}

// API Response Wrappers
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// Auth
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

export interface LoginResponse {
  tokens: AuthTokens;
  user: User;
  is_new_user: boolean;
}
