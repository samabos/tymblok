# Tymblok - Technical Specification Document

**Version:** 1.0  
**Date:** January 29, 2026  
**Product:** Tymblok - Developer-Aware Time Blocking App  
**Domain:** tymblok.io

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Feature Specifications](#2-feature-specifications)
3. [Technical Architecture](#3-technical-architecture)
4. [Database Schema](#4-database-schema)
5. [API Contracts](#5-api-contracts)
6. [Mobile App Structure (React Native)](#6-mobile-app-structure-react-native)
7. [Desktop App Structure (Tauri)](#7-desktop-app-structure-tauri)
8. [UI/UX Specifications](#8-uiux-specifications)
9. [Third-Party Integrations](#9-third-party-integrations)
10. [Subscription & Payments](#10-subscription--payments)
11. [Implementation Phases](#11-implementation-phases)
12. [Testing Strategy](#12-testing-strategy)
13. [Deployment & CI/CD](#13-deployment--cicd)

---

## 1. Product Overview

### 1.1 Vision

Tymblok is a developer-aware time blocking application that intelligently schedules your day by understanding your workload from engineering tools (GitHub, Jira) and calendar. Unlike generic scheduling apps, Tymblok treats PR review age, sprint deadlines, and code review batching as first-class scheduling signals.

### 1.2 Target Users

- Software developers and engineers
- Engineering team leads
- Technical product managers
- DevOps engineers

### 1.3 Platforms

| Platform | Technology | Priority |
|----------|------------|----------|
| iOS | React Native | Phase 1 |
| Android | React Native | Phase 1 |
| Windows Desktop | Tauri + React | Phase 2 |
| Web (PWA) | React | Phase 3 |

### 1.4 Core Value Proposition

1. **Developer-Aware Scheduling** - Understands PR staleness, sprint deadlines, ticket priority
2. **Context Batching** - Groups similar tasks (all PR reviews together)
3. **Fluid UI** - Smooth day-sliding, drag-and-drop time blocks
4. **Smart Replanning** - Adapts when meetings change

---

## 2. Feature Specifications

### Phase 1: Foundation (MVP)

#### 2.1 Authentication & Onboarding

```
Feature: AUTH-001 - Google OAuth Sign-in
Description: One-tap Google sign-in with calendar access request
Acceptance Criteria:
  - User can sign in with Google account in < 3 taps
  - Request calendar read/write permissions
  - Store refresh token securely
  - Handle token refresh automatically

Feature: AUTH-002 - GitHub OAuth Sign-in  
Description: One-tap GitHub sign-in with repo access
Acceptance Criteria:
  - User can sign in with GitHub account
  - Request read access to repos, PRs, issues
  - Store access token securely
  - Support organization access

Feature: AUTH-003 - Account Linking
Description: Link multiple OAuth providers to single account
Acceptance Criteria:
  - User with Google account can add GitHub
  - User with GitHub account can add Google
  - Merge accounts if email matches
  - Display linked accounts in settings

Feature: AUTH-004 - Onboarding Wizard
Description: Guide new users through initial setup
Steps:
  1. Welcome screen with value proposition
  2. Connect Google Calendar (required)
  3. Connect GitHub (optional, recommended)
  4. Connect Jira (optional)
  5. Set working hours (default 9am-6pm)
  6. Set lunch break (default 12pm-1pm)
  7. Generate first day plan
```

#### 2.2 Calendar Core

```
Feature: CAL-001 - Day View
Description: Hourly time grid showing scheduled blocks
Specifications:
  - Default view: 6am - 10pm (configurable)
  - Hour height: 60dp (configurable via pinch)
  - Current time indicator: red horizontal line
  - Fixed events: solid color
  - Tymblok tasks: gradient/pattern fill
  - Available slots: subtle background

Feature: CAL-002 - Day Swiping
Description: Horizontal swipe between days
Specifications:
  - Infinite scroll past/future (±1000 days from today)
  - Physics-based momentum scrolling
  - Snap to day boundaries
  - Preload adjacent days (offscreenPageLimit: 1)
  - Header date updates during swipe

Feature: CAL-003 - Pinch to Zoom
Description: Adjust time scale granularity
Specifications:
  - Levels: 15min, 30min, 1hr, 2hr
  - Smooth animated transitions
  - Persist user preference
  - Default: 1hr increments

Feature: CAL-004 - Current Time Indicator
Description: Show current time position
Specifications:
  - Red horizontal line spanning full width
  - Small red dot on left edge
  - Auto-scroll to current time on app open
  - Update position every minute

Feature: CAL-005 - Jump to Today
Description: Quick navigation to current day
Specifications:
  - Floating action button (bottom right)
  - Only visible when not on today
  - Animated scroll to today
```

#### 2.3 Manual Tasks

```
Feature: TASK-001 - Create One-Time Task
Description: Add a single task to backlog or calendar
Fields:
  - title: string (required, max 100 chars)
  - duration: number (minutes, default 30)
  - notes: string (optional, max 500 chars)
  - category: enum (work, personal, health, admin)
  - color: hex string (default by category)
  - scheduledAt: datetime (optional)
  
Feature: TASK-002 - Create Recurring Task
Description: Add repeating tasks
Fields:
  - ...all from TASK-001
  - recurrence: object
    - type: enum (daily, weekdays, weekly, monthly, custom)
    - interval: number (every N days/weeks)
    - daysOfWeek: number[] (0-6, for weekly)
    - endDate: date (optional)
    - exceptions: date[] (skip dates)

Feature: TASK-003 - Task Templates
Description: Pre-configured recurring tasks
Templates:
  - Breakfast: 30min, daily, 8am default, health category
  - Lunch: 60min, weekdays, 12pm default, health category
  - Gym: 60min, custom days, health category
  - Commute: 30min, weekdays, personal category
  - Deep Work: 120min, weekdays, work category
  - Daily Standup: 15min, weekdays, work category

Feature: TASK-004 - Drag to Schedule
Description: Drag task from backlog to time slot
Specifications:
  - Long press task card to initiate drag
  - Show ghost preview while dragging
  - Snap to 15min increments
  - Haptic feedback on drop
  - Undo toast for 5 seconds

Feature: TASK-005 - Drag to Move
Description: Move scheduled task to different time
Specifications:
  - Long press scheduled block to initiate
  - Highlight valid drop zones
  - Prevent overlap with fixed events
  - Allow same-day and cross-day moves

Feature: TASK-006 - Drag to Resize
Description: Adjust task duration by dragging edges
Specifications:
  - Drag handles on top/bottom edges
  - Minimum duration: 15min
  - Snap to 15min increments
  - Show duration label while resizing
  - Haptic feedback at snap points

Feature: TASK-007 - Task Actions
Description: Quick actions on tasks
Actions:
  - Long press → Context menu
  - Swipe right → Mark complete
  - Swipe left → Delete (with confirmation)
  - Tap → View/edit details
  - Double tap → Quick complete
```

#### 2.4 Google Calendar Integration

```
Feature: GCAL-001 - OAuth Connection
Description: Connect Google Calendar via OAuth 2.0
Scopes:
  - https://www.googleapis.com/auth/calendar.readonly
  - https://www.googleapis.com/auth/calendar.events
Flow:
  1. Redirect to Google consent screen
  2. User grants permissions
  3. Exchange code for tokens
  4. Store refresh token encrypted
  5. Sync calendar data

Feature: GCAL-002 - Event Sync (Read)
Description: Pull events from Google Calendar
Specifications:
  - Initial sync: past 7 days, future 30 days
  - Incremental sync: use syncToken
  - Sync frequency: on app open + every 15min background
  - Handle recurring events expansion
  - Respect event privacy settings

Feature: GCAL-003 - Event Sync (Write)
Description: Push Tymblok blocks to Google Calendar
Specifications:
  - Create events for scheduled Tymblok tasks
  - Use specific calendar (user selectable)
  - Include task notes in event description
  - Set appropriate reminders
  - Update on reschedule, delete on removal

Feature: GCAL-004 - Visual Distinction
Description: Differentiate synced vs local items
Specifications:
  - Google events: solid fill, calendar icon badge
  - Tymblok tasks: gradient fill, Tymblok icon badge
  - Color: respect Google Calendar event color
```

---

### Phase 2: Developer Integrations

#### 2.5 GitHub Integration

```
Feature: GH-001 - OAuth Connection
Description: Connect GitHub via OAuth
Scopes:
  - repo (read access to repos)
  - read:user (user profile)
Flow:
  1. Redirect to GitHub authorization
  2. User grants permissions
  3. Exchange code for access token
  4. Store token encrypted
  5. Fetch user repos and PRs

Feature: GH-002 - Fetch PRs for Review
Description: Get PRs where user is requested reviewer
API: GET /user/repos → GET /repos/{owner}/{repo}/pulls
Data:
  - PR number, title, URL
  - Author name and avatar
  - Created date (for staleness calculation)
  - Review comments count
  - CI status (pending, success, failure)
  - Files changed count, additions, deletions
Sync: Every 5 minutes when app active

Feature: GH-003 - Fetch Authored PRs
Description: Get PRs created by user needing attention
Filter:
  - Requested changes
  - Merge conflicts
  - Failing CI
  - No activity > 24h
Data: Same as GH-002

Feature: GH-004 - Fetch Assigned Issues
Description: Get issues assigned to user
API: GET /issues?filter=assigned
Data:
  - Issue number, title, URL
  - Labels, milestone
  - Created date
  - Comments count

Feature: GH-005 - PR Task Generation
Description: Auto-create task blocks from PRs
Logic:
  - Group PRs by repo for batching
  - Estimate review time: 5min base + 1min per 50 lines
  - Set priority by staleness:
    - > 48h: critical (red)
    - > 24h: high (orange)
    - > 4h: normal (yellow)
    - < 4h: low (green)
  - Create "PR Review" block with PR list
```

#### 2.6 Jira Integration

```
Feature: JIRA-001 - Connection Setup
Description: Connect Jira Cloud via OAuth 2.0
Scopes:
  - read:jira-work
  - read:jira-user
Flow:
  1. User enters Jira domain
  2. Redirect to Atlassian consent
  3. Exchange code for tokens
  4. Store tokens encrypted

Feature: JIRA-002 - Fetch Assigned Tickets
Description: Get tickets assigned to user
API: /rest/api/3/search?jql=assignee=currentuser()
Data:
  - Key, summary, description
  - Issue type, priority
  - Status, sprint
  - Story points, time estimate
  - Due date
  - Labels, components

Feature: JIRA-003 - Fetch Sprint Data
Description: Get current sprint information
API: /rest/agile/1.0/board/{boardId}/sprint
Data:
  - Sprint name, goal
  - Start date, end date
  - Days remaining

Feature: JIRA-004 - Ticket Task Generation
Description: Auto-create task blocks from tickets
Logic:
  - Use Jira time estimate if available
  - Otherwise estimate by story points:
    - 1 point: 30min
    - 2 points: 1hr
    - 3 points: 2hr
    - 5 points: 4hr
    - 8+ points: 8hr (suggest breakdown)
  - Set priority by:
    - Sprint deadline proximity
    - Jira priority field
    - Blocker status
```

#### 2.7 Smart Task Inbox

```
Feature: INBOX-001 - Unified Task Inbox
Description: Combined view of all task sources
Sources:
  - Manual tasks (unscheduled)
  - GitHub PRs pending review
  - GitHub issues assigned
  - Jira tickets assigned
Display:
  - Source icon badge
  - Priority indicator
  - Staleness/deadline info
  - Estimated duration

Feature: INBOX-002 - Sorting & Filtering
Description: Organize inbox items
Sort Options:
  - Priority (smart default)
  - Deadline
  - Age (oldest first)
  - Duration (shortest first)
  - Manual order
Filter Options:
  - By source (GitHub, Jira, Manual)
  - By project/repo
  - By label/category
  - By priority level

Feature: INBOX-003 - Bulk Scheduling
Description: Schedule multiple items at once
Specifications:
  - Multi-select mode (checkbox each item)
  - "Schedule selected" button
  - Auto-place in optimal slots
  - Respect batching preferences
```

---

### Phase 3: Intelligent Scheduling

#### 2.8 Auto-Schedule Engine

```
Feature: SCHED-001 - Plan My Day
Description: AI-powered daily schedule generation
Algorithm:
  1. Load fixed events (meetings, recurring)
  2. Load pending tasks from inbox
  3. Score each task:
     - PR staleness: +10 per 24h age
     - Sprint deadline: +20 if due in 2 days
     - Explicit priority: high=15, medium=10, low=5
     - Blocking others: +25
  4. Sort by score descending
  5. Place tasks in available slots:
     - Respect working hours
     - Respect lunch break
     - Apply batching rules
     - Honor focus time preferences
  6. Present proposed schedule for approval

Feature: SCHED-002 - Context Batching
Description: Group similar tasks together
Rules:
  - All PR reviews in single block (max 2hr)
  - All code reviews before 11am (configurable)
  - Similar Jira tickets by epic/project
  - Admin tasks batched to end of day

Feature: SCHED-003 - Focus Time Protection
Description: Protect deep work blocks
Settings:
  - Preferred focus time: morning/afternoon/flexible
  - Minimum focus block: 1hr (configurable)
  - Maximum meetings before focus: 1
  - Auto-decline meeting invites during focus (optional)

Feature: SCHED-004 - Schedule Scoring
Description: Rate proposed schedule quality
Factors:
  - Focus time achieved vs goal
  - Context switches minimized
  - High priority items scheduled
  - Buffer time between meetings
Display:
  - Overall score (A-F or 0-100)
  - Breakdown by factor
  - Suggestions for improvement
```

#### 2.9 Replanning & Adaptation

```
Feature: REPLAN-001 - Dynamic Replan
Description: Replan remaining day after disruption
Triggers:
  - New meeting added
  - Meeting runs over
  - Task takes longer than estimated
  - User requests replan
Logic:
  - Keep completed tasks
  - Reschedule remaining by priority
  - Notify user of changes
  - Allow undo

Feature: REPLAN-002 - Task Carryover
Description: Handle incomplete tasks
Options:
  - Auto-move to tomorrow
  - Move to backlog
  - Reschedule to specific date
  - Mark as dropped (with reason)
End of Day Prompt:
  - Show incomplete tasks
  - Quick action buttons for each
  - Learn from patterns

Feature: REPLAN-003 - Snooze Task
Description: Defer task to later
Options:
  - Later today (next available slot)
  - Tomorrow morning
  - Tomorrow afternoon
  - Next week
  - Custom date/time
```

---

### Phase 4: Productivity Features

#### 2.10 Focus Mode

```
Feature: FOCUS-001 - Focus Session
Description: Timed focus on current block
Specifications:
  - Start from scheduled block
  - Countdown timer display
  - Optional: block notifications
  - Progress indicator
  - Ambient sound options (optional)

Feature: FOCUS-002 - Focus Complete
Description: End focus session
Actions:
  - Auto-mark task complete
  - Prompt: "Did you finish?"
  - Log actual time spent
  - Suggest break if > 90min

Feature: FOCUS-003 - Do Not Disturb
Description: System DND integration
Specifications:
  - Auto-enable DND during focus
  - Whitelist urgent contacts
  - Auto-disable when session ends
  - Respect system DND settings
```

#### 2.11 Daily Review

```
Feature: REVIEW-001 - End of Day Prompt
Description: Daily completion review
Timing: Configurable (default 5pm)
Content:
  - Tasks scheduled today
  - Completion status each
  - Quick complete/defer actions
  - Optional: what blocked you?

Feature: REVIEW-002 - Completion Analytics
Description: Track daily completion rate
Metrics:
  - Tasks completed vs planned
  - Time estimated vs actual
  - Streak tracking
  - Weekly trends
```

#### 2.12 Weekly Planning

```
Feature: WEEK-001 - Week View
Description: 7-day overview
Specifications:
  - Horizontal scroll through weeks
  - Day columns with summarized blocks
  - Drag tasks between days
  - Pinch to zoom (show more/less detail)

Feature: WEEK-002 - Weekly Recurring
Description: Week-level recurring tasks
Examples:
  - Sprint planning (Monday 10am)
  - Team sync (Wednesday 2pm)
  - Friday retrospective
  - Weekly review (Sunday 6pm)

Feature: WEEK-003 - Week Summary
Description: Weekly productivity report
Metrics:
  - Total focus time
  - PRs reviewed
  - Tickets completed
  - Meetings vs deep work ratio
  - Comparison to previous week
```

---

### Phase 5: Analytics & Teams (Future)

```
Feature: ANALYTICS-001 - Personal Dashboard
Metrics:
  - Time by category (pie chart)
  - PR review turnaround trend (line)
  - Focus time vs goal (progress bar)
  - Completion rate trend (line)
  - Best productivity day/time

Feature: ANALYTICS-002 - Habit Streaks
Track:
  - Daily planning streak
  - Focus time goal streak
  - Review completion streak
  - On-time start streak

Feature: TEAM-001 - Team Workspace (Future)
Features:
  - Shared visibility
  - PR review load balancing
  - Team scheduling links
  - Manager dashboard
```

---

## 3. Technical Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
├─────────────────┬─────────────────┬─────────────────────────┤
│   iOS App       │   Android App   │   Windows Desktop       │
│   (React Native)│   (React Native)│   (Tauri + React)       │
└────────┬────────┴────────┬────────┴────────┬────────────────┘
         │                 │                 │
         └────────────────┬┴─────────────────┘
                          │ HTTPS/WSS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY                               │
│                  (Azure API Management)                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Auth      │  │   Core      │  │  Scheduler  │
│   Service   │  │   API       │  │   Service   │
│  (ASP.NET)  │  │  (ASP.NET)  │  │  (ASP.NET)  │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                               │
├─────────────────┬─────────────────┬─────────────────────────┤
│   PostgreSQL    │     Redis       │   Azure Blob            │
│   (Primary DB)  │    (Cache)      │   (File Storage)        │
└─────────────────┴─────────────────┴─────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   GitHub    │  │   Google    │  │    Jira     │
│    API      │  │  Calendar   │  │    API      │
└─────────────┘  └─────────────┘  └─────────────┘
```

### 3.2 Backend Services

| Service | Responsibility | Technology |
|---------|---------------|------------|
| Auth Service | OAuth flows, JWT tokens, session management | ASP.NET Core 8, Identity |
| Core API | CRUD operations, business logic | ASP.NET Core 8, EF Core |
| Scheduler Service | Auto-scheduling algorithm, background sync | ASP.NET Core 8, Hangfire |
| Notification Service | Push notifications, email | Azure Functions, FCM/APNS |

### 3.3 Technology Stack

**Backend:**
- Runtime: .NET 8
- Framework: ASP.NET Core 8 Web API
- ORM: Entity Framework Core 8
- Database: PostgreSQL 16
- Cache: Redis 7
- Background Jobs: Hangfire
- Message Queue: Azure Service Bus (future)

**Mobile:**
- Framework: React Native 0.73+ (New Architecture)
- Navigation: Expo Router
- State Management: Zustand
- Animations: React Native Reanimated 3
- Gestures: React Native Gesture Handler
- Styling: NativeWind (Tailwind CSS)
- HTTP Client: Axios + React Query

**Desktop:**
- Framework: Tauri 2.0
- UI: React + Vite
- Shared: Common TypeScript library

**Infrastructure:**
- Hosting: Azure App Service
- CDN: Azure CDN
- Monitoring: Application Insights
- CI/CD: GitHub Actions

---

## 4. Database Schema

### 4.1 Core Tables

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    avatar_url VARCHAR(500),
    timezone VARCHAR(50) DEFAULT 'UTC',
    working_hours_start TIME DEFAULT '09:00',
    working_hours_end TIME DEFAULT '18:00',
    lunch_start TIME DEFAULT '12:00',
    lunch_duration_minutes INT DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth connections
CREATE TABLE oauth_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'google', 'github', 'jira'
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes TEXT[],
    metadata JSONB, -- provider-specific data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Categories for tasks
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL, -- hex color
    icon VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks (both one-time and recurring definitions)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    title VARCHAR(255) NOT NULL,
    notes TEXT,
    duration_minutes INT NOT NULL DEFAULT 30,
    source VARCHAR(50) NOT NULL DEFAULT 'manual', -- 'manual', 'github_pr', 'github_issue', 'jira'
    source_id VARCHAR(255), -- external ID
    source_url VARCHAR(500),
    source_metadata JSONB, -- PR details, ticket info, etc.
    priority VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule JSONB, -- {type, interval, daysOfWeek, endDate, exceptions}
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled blocks (instances of tasks on calendar)
CREATE TABLE scheduled_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL, -- denormalized for display
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'skipped', 'moved'
    source VARCHAR(50) NOT NULL DEFAULT 'tymblok', -- 'tymblok', 'google_calendar'
    external_event_id VARCHAR(255), -- Google Calendar event ID
    color VARCHAR(7),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- External calendar events (synced from Google)
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL,
    calendar_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_all_day BOOLEAN DEFAULT FALSE,
    location VARCHAR(500),
    attendees JSONB,
    recurrence_rule VARCHAR(500),
    color VARCHAR(7),
    status VARCHAR(50), -- 'confirmed', 'tentative', 'cancelled'
    sync_token VARCHAR(255),
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, external_id)
);

-- GitHub sync data
CREATE TABLE github_pull_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repo_full_name VARCHAR(255) NOT NULL,
    pr_number INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    url VARCHAR(500) NOT NULL,
    author_login VARCHAR(100),
    author_avatar_url VARCHAR(500),
    state VARCHAR(50),
    is_review_requested BOOLEAN DEFAULT FALSE,
    is_authored BOOLEAN DEFAULT FALSE,
    created_at_remote TIMESTAMPTZ,
    updated_at_remote TIMESTAMPTZ,
    additions INT DEFAULT 0,
    deletions INT DEFAULT 0,
    files_changed INT DEFAULT 0,
    ci_status VARCHAR(50), -- 'pending', 'success', 'failure'
    review_comments_count INT DEFAULT 0,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, repo_full_name, pr_number)
);

-- Jira sync data
CREATE TABLE jira_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticket_key VARCHAR(50) NOT NULL,
    summary VARCHAR(500) NOT NULL,
    description TEXT,
    url VARCHAR(500) NOT NULL,
    issue_type VARCHAR(100),
    status VARCHAR(100),
    priority VARCHAR(50),
    sprint_name VARCHAR(255),
    sprint_end_date DATE,
    story_points DECIMAL(5,2),
    time_estimate_seconds INT,
    due_date DATE,
    labels TEXT[],
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, ticket_key)
);

-- User preferences
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    focus_time_preference VARCHAR(20) DEFAULT 'morning', -- 'morning', 'afternoon', 'flexible'
    min_focus_block_minutes INT DEFAULT 60,
    enable_auto_schedule BOOLEAN DEFAULT TRUE,
    enable_batching BOOLEAN DEFAULT TRUE,
    batch_pr_reviews BOOLEAN DEFAULT TRUE,
    pr_review_time_preference VARCHAR(20) DEFAULT 'morning',
    notification_daily_plan BOOLEAN DEFAULT TRUE,
    notification_daily_plan_time TIME DEFAULT '08:00',
    notification_end_of_day BOOLEAN DEFAULT TRUE,
    notification_end_of_day_time TIME DEFAULT '17:00',
    theme VARCHAR(20) DEFAULT 'system', -- 'light', 'dark', 'system'
    default_task_duration_minutes INT DEFAULT 30,
    week_start_day INT DEFAULT 1, -- 0=Sunday, 1=Monday
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics / metrics
CREATE TABLE daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    tasks_planned INT DEFAULT 0,
    tasks_completed INT DEFAULT 0,
    focus_time_planned_minutes INT DEFAULT 0,
    focus_time_actual_minutes INT DEFAULT 0,
    prs_reviewed INT DEFAULT 0,
    meetings_attended INT DEFAULT 0,
    context_switches INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_source ON tasks(source, source_id);
CREATE INDEX idx_scheduled_blocks_user_time ON scheduled_blocks(user_id, start_time, end_time);
CREATE INDEX idx_calendar_events_user_time ON calendar_events(user_id, start_time, end_time);
CREATE INDEX idx_github_prs_user ON github_pull_requests(user_id, is_review_requested);
CREATE INDEX idx_jira_tickets_user ON jira_tickets(user_id);
```

---

## 5. API Contracts

### 5.1 Authentication Endpoints

```yaml
# POST /api/auth/google
# Exchange Google OAuth code for Tymblok tokens
Request:
  code: string (required)
  redirect_uri: string (required)
Response:
  access_token: string
  refresh_token: string
  expires_in: number
  user:
    id: string
    email: string
    name: string
    avatar_url: string

# POST /api/auth/github
# Exchange GitHub OAuth code for Tymblok tokens
Request:
  code: string (required)
Response:
  access_token: string
  refresh_token: string
  expires_in: number
  user: User

# POST /api/auth/refresh
# Refresh access token
Request:
  refresh_token: string (required)
Response:
  access_token: string
  expires_in: number

# POST /api/auth/link/{provider}
# Link additional OAuth provider to existing account
Request:
  code: string (required)
Response:
  success: boolean
  provider: string

# DELETE /api/auth/link/{provider}
# Unlink OAuth provider
Response:
  success: boolean
```

### 5.2 Task Endpoints

```yaml
# GET /api/tasks
# List user's tasks
Query:
  status: string (pending, completed, archived)
  source: string (manual, github_pr, github_issue, jira)
  category_id: string
  limit: number (default 50)
  offset: number (default 0)
Response:
  tasks: Task[]
  total: number

# POST /api/tasks
# Create new task
Request:
  title: string (required)
  notes: string
  duration_minutes: number
  category_id: string
  priority: string
  is_recurring: boolean
  recurrence_rule: RecurrenceRule
Response:
  task: Task

# GET /api/tasks/{id}
Response:
  task: Task

# PATCH /api/tasks/{id}
Request:
  title: string
  notes: string
  duration_minutes: number
  category_id: string
  priority: string
  is_completed: boolean
Response:
  task: Task

# DELETE /api/tasks/{id}
Response:
  success: boolean

# POST /api/tasks/{id}/complete
Request:
  actual_duration_minutes: number
Response:
  task: Task
```

### 5.3 Schedule Endpoints

```yaml
# GET /api/schedule
# Get scheduled blocks for date range
Query:
  start_date: string (ISO date, required)
  end_date: string (ISO date, required)
  include_calendar_events: boolean (default true)
Response:
  blocks: ScheduledBlock[]
  calendar_events: CalendarEvent[]

# POST /api/schedule/blocks
# Create scheduled block
Request:
  task_id: string (optional, for manual creation)
  title: string (required if no task_id)
  start_time: string (ISO datetime, required)
  end_time: string (ISO datetime, required)
  color: string
  notes: string
  sync_to_calendar: boolean (default true)
Response:
  block: ScheduledBlock

# PATCH /api/schedule/blocks/{id}
# Update block (move, resize)
Request:
  start_time: string
  end_time: string
  status: string
Response:
  block: ScheduledBlock

# DELETE /api/schedule/blocks/{id}
Query:
  delete_from_calendar: boolean (default true)
Response:
  success: boolean

# POST /api/schedule/auto-plan
# Generate AI schedule for day
Request:
  date: string (ISO date, required)
  tasks_to_schedule: string[] (task IDs, optional - uses inbox if empty)
  respect_existing: boolean (default true)
Response:
  proposed_blocks: ScheduledBlock[]
  score: ScheduleScore
  warnings: string[]

# POST /api/schedule/auto-plan/accept
# Accept proposed schedule
Request:
  blocks: ScheduledBlock[]
Response:
  blocks: ScheduledBlock[]

# POST /api/schedule/replan
# Replan remaining day
Request:
  from_time: string (ISO datetime, default now)
Response:
  updated_blocks: ScheduledBlock[]
  removed_blocks: string[] (IDs)
```

### 5.4 Integration Endpoints

```yaml
# POST /api/integrations/google/sync
# Trigger Google Calendar sync
Response:
  events_synced: number
  last_sync: string

# POST /api/integrations/github/sync
# Trigger GitHub sync
Response:
  prs_synced: number
  issues_synced: number
  last_sync: string

# GET /api/integrations/github/prs
# Get synced PRs
Query:
  type: string (review_requested, authored)
Response:
  pull_requests: GitHubPR[]

# POST /api/integrations/jira/sync
Response:
  tickets_synced: number
  last_sync: string

# GET /api/integrations/jira/tickets
Response:
  tickets: JiraTicket[]
```

### 5.5 Data Types

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  timezone: string;
  working_hours_start: string; // "09:00"
  working_hours_end: string;   // "18:00"
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  notes: string | null;
  duration_minutes: number;
  category: Category | null;
  source: 'manual' | 'github_pr' | 'github_issue' | 'jira';
  source_id: string | null;
  source_url: string | null;
  source_metadata: object | null;
  priority: 'critical' | 'high' | 'medium' | 'low';
  is_recurring: boolean;
  recurrence_rule: RecurrenceRule | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RecurrenceRule {
  type: 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  days_of_week: number[]; // 0-6
  end_date: string | null;
  exceptions: string[]; // dates to skip
}

interface ScheduledBlock {
  id: string;
  task_id: string | null;
  title: string;
  start_time: string;
  end_time: string;
  actual_start_time: string | null;
  actual_end_time: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'moved';
  source: 'tymblok' | 'google_calendar';
  external_event_id: string | null;
  color: string;
  notes: string | null;
}

interface CalendarEvent {
  id: string;
  external_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  location: string | null;
  attendees: Attendee[];
  color: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
}

interface ScheduleScore {
  overall: number; // 0-100
  focus_time_score: number;
  priority_coverage: number;
  context_switch_score: number;
  buffer_time_score: number;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}
```

---

## 6. Mobile App Structure (React Native)

### 6.1 Project Structure

```
tymblok-mobile/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Auth screens (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── onboarding/
│   │       ├── welcome.tsx
│   │       ├── connect-calendar.tsx
│   │       ├── connect-github.tsx
│   │       ├── working-hours.tsx
│   │       └── first-plan.tsx
│   ├── (tabs)/                   # Main tab screens
│   │   ├── _layout.tsx
│   │   ├── today.tsx             # Day view (default)
│   │   ├── inbox.tsx             # Task inbox
│   │   ├── week.tsx              # Week view
│   │   └── settings.tsx          # Settings
│   ├── _layout.tsx               # Root layout
│   ├── task/[id].tsx             # Task detail modal
│   └── block/[id].tsx            # Block detail modal
│
├── components/
│   ├── calendar/
│   │   ├── DaySwiper.tsx         # Horizontal day navigation
│   │   ├── DayView.tsx           # Single day container
│   │   ├── TimeGrid.tsx          # Hour lines background
│   │   ├── TimeBlock.tsx         # Scheduled block component
│   │   ├── CurrentTimeIndicator.tsx
│   │   ├── DateHeader.tsx
│   │   └── WeekView.tsx
│   ├── tasks/
│   │   ├── TaskCard.tsx          # Inbox task card
│   │   ├── TaskList.tsx          # Task list with filters
│   │   ├── TaskForm.tsx          # Create/edit task
│   │   ├── RecurrencePicker.tsx
│   │   └── CategoryPicker.tsx
│   ├── schedule/
│   │   ├── AutoPlanButton.tsx
│   │   ├── PlanProposal.tsx
│   │   └── ScheduleScore.tsx
│   ├── integrations/
│   │   ├── GitHubPRCard.tsx
│   │   ├── JiraTicketCard.tsx
│   │   └── CalendarEventCard.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       ├── Toast.tsx
│       └── LoadingSpinner.tsx
│
├── hooks/
│   ├── useAuth.ts                # Auth state and methods
│   ├── useSchedule.ts            # Schedule data and mutations
│   ├── useTasks.ts               # Tasks data and mutations
│   ├── useCalendar.ts            # Calendar sync
│   ├── useGitHub.ts              # GitHub data
│   ├── useJira.ts                # Jira data
│   ├── useDaySwipe.ts            # Day navigation state
│   └── useAutoSchedule.ts        # Auto-plan logic
│
├── stores/
│   ├── authStore.ts              # Zustand auth store
│   ├── scheduleStore.ts          # Schedule state
│   ├── taskStore.ts              # Task state
│   └── settingsStore.ts          # User preferences
│
├── services/
│   ├── api/
│   │   ├── client.ts             # Axios instance
│   │   ├── auth.ts
│   │   ├── tasks.ts
│   │   ├── schedule.ts
│   │   └── integrations.ts
│   ├── oauth/
│   │   ├── google.ts
│   │   ├── github.ts
│   │   └── jira.ts
│   └── notifications/
│       └── push.ts
│
├── utils/
│   ├── date.ts                   # Date helpers (date-fns)
│   ├── colors.ts                 # Color utilities
│   ├── scheduling.ts             # Scheduling algorithms
│   └── storage.ts                # Secure storage
│
├── constants/
│   ├── colors.ts
│   ├── layout.ts
│   └── config.ts
│
├── types/
│   ├── api.ts                    # API response types
│   ├── models.ts                 # Domain models
│   └── navigation.ts             # Navigation types
│
├── assets/
│   ├── images/
│   └── fonts/
│
├── app.json                      # Expo config
├── package.json
├── tsconfig.json
├── tailwind.config.js            # NativeWind config
└── babel.config.js
```

### 6.2 Key Components Implementation

#### DaySwiper.tsx

```tsx
import React, { useCallback, useMemo } from 'react';
import { Dimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import { addDays, format, startOfDay } from 'date-fns';
import { DayView } from './DayView';
import { useDaySwipe } from '@/hooks/useDaySwipe';

const INITIAL_INDEX = 1000;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DaySwiperProps {
  onDateChange: (date: Date) => void;
}

export function DaySwiper({ onDateChange }: DaySwiperProps) {
  const { baseDate, setCurrentIndex } = useDaySwipe();
  
  const handlePageSelected = useCallback((e: { nativeEvent: { position: number } }) => {
    const index = e.nativeEvent.position;
    setCurrentIndex(index);
    const offset = index - INITIAL_INDEX;
    const newDate = addDays(startOfDay(baseDate), offset);
    onDateChange(newDate);
  }, [baseDate, onDateChange, setCurrentIndex]);

  const renderDay = useCallback((index: number) => {
    const offset = index - INITIAL_INDEX;
    const date = addDays(startOfDay(baseDate), offset);
    return <DayView key={index} date={date} />;
  }, [baseDate]);

  return (
    <PagerView
      style={{ flex: 1 }}
      initialPage={INITIAL_INDEX}
      onPageSelected={handlePageSelected}
      offscreenPageLimit={1}
      overdrag={true}
    >
      {Array.from({ length: 2001 }, (_, i) => renderDay(i))}
    </PagerView>
  );
}
```

#### TimeBlock.tsx

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ScheduledBlock } from '@/types/models';

const HOUR_HEIGHT = 60;
const SNAP_MINUTES = 15;

interface TimeBlockProps {
  block: ScheduledBlock;
  onMove: (id: string, newStart: Date, newEnd: Date) => void;
  onResize: (id: string, newDuration: number) => void;
  onPress: (block: ScheduledBlock) => void;
}

export function TimeBlock({ block, onMove, onResize, onPress }: TimeBlockProps) {
  const startHour = new Date(block.start_time).getHours() + 
                    new Date(block.start_time).getMinutes() / 60;
  const duration = (new Date(block.end_time).getTime() - 
                   new Date(block.start_time).getTime()) / (1000 * 60 * 60);

  const translateY = useSharedValue(0);
  const height = useSharedValue(duration * HOUR_HEIGHT);
  const isDragging = useSharedValue(false);
  const isResizing = useSharedValue(false);

  // Drag gesture for moving
  const dragGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((e) => {
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      isDragging.value = false;
      const snapMinutes = Math.round(e.translationY / (HOUR_HEIGHT / 60) / SNAP_MINUTES) * SNAP_MINUTES;
      const newStart = new Date(block.start_time);
      newStart.setMinutes(newStart.getMinutes() + snapMinutes);
      const newEnd = new Date(block.end_time);
      newEnd.setMinutes(newEnd.getMinutes() + snapMinutes);
      
      translateY.value = withSpring(0);
      runOnJS(onMove)(block.id, newStart, newEnd);
    });

  // Resize gesture
  const resizeGesture = Gesture.Pan()
    .onStart(() => {
      isResizing.value = true;
    })
    .onUpdate((e) => {
      const newHeight = Math.max(
        SNAP_MINUTES / 60 * HOUR_HEIGHT,
        duration * HOUR_HEIGHT + e.translationY
      );
      height.value = newHeight;
    })
    .onEnd(() => {
      isResizing.value = false;
      const newDurationHours = Math.round(height.value / HOUR_HEIGHT * 4) / 4;
      height.value = withSpring(newDurationHours * HOUR_HEIGHT);
      runOnJS(onResize)(block.id, newDurationHours * 60);
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(onPress)(block);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: startHour * HOUR_HEIGHT + translateY.value,
    height: height.value,
    left: 60,
    right: 8,
    backgroundColor: block.color || '#3B82F6',
    borderRadius: 8,
    padding: 8,
    opacity: isDragging.value || isResizing.value ? 0.8 : 1,
    transform: [{ scale: isDragging.value ? 1.02 : 1 }],
  }));

  return (
    <GestureDetector gesture={Gesture.Race(dragGesture, tapGesture)}>
      <Animated.View style={animatedStyle}>
        <Text className="text-white font-semibold text-sm" numberOfLines={1}>
          {block.title}
        </Text>
        {duration >= 0.5 && (
          <Text className="text-white/70 text-xs">
            {format(new Date(block.start_time), 'h:mm a')} - 
            {format(new Date(block.end_time), 'h:mm a')}
          </Text>
        )}
        
        {/* Resize handle */}
        <GestureDetector gesture={resizeGesture}>
          <View className="absolute bottom-0 left-0 right-0 h-4 items-center justify-center">
            <View className="w-8 h-1 bg-white/50 rounded-full" />
          </View>
        </GestureDetector>
      </Animated.View>
    </GestureDetector>
  );
}
```

### 6.3 State Management (Zustand)

```typescript
// stores/scheduleStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScheduledBlock, CalendarEvent } from '@/types/models';
import * as api from '@/services/api/schedule';

interface ScheduleState {
  // State
  blocks: Record<string, ScheduledBlock[]>; // keyed by date string
  calendarEvents: Record<string, CalendarEvent[]>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchSchedule: (startDate: Date, endDate: Date) => Promise<void>;
  createBlock: (block: Partial<ScheduledBlock>) => Promise<ScheduledBlock>;
  updateBlock: (id: string, updates: Partial<ScheduledBlock>) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  autoPlan: (date: Date) => Promise<ScheduledBlock[]>;
  acceptPlan: (blocks: ScheduledBlock[]) => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      blocks: {},
      calendarEvents: {},
      isLoading: false,
      error: null,

      fetchSchedule: async (startDate, endDate) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.getSchedule(startDate, endDate);
          const blocksByDate: Record<string, ScheduledBlock[]> = {};
          const eventsByDate: Record<string, CalendarEvent[]> = {};
          
          response.blocks.forEach(block => {
            const dateKey = block.start_time.split('T')[0];
            if (!blocksByDate[dateKey]) blocksByDate[dateKey] = [];
            blocksByDate[dateKey].push(block);
          });
          
          response.calendar_events.forEach(event => {
            const dateKey = event.start_time.split('T')[0];
            if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
            eventsByDate[dateKey].push(event);
          });
          
          set(state => ({
            blocks: { ...state.blocks, ...blocksByDate },
            calendarEvents: { ...state.calendarEvents, ...eventsByDate },
            isLoading: false,
          }));
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      createBlock: async (blockData) => {
        const block = await api.createBlock(blockData);
        const dateKey = block.start_time.split('T')[0];
        set(state => ({
          blocks: {
            ...state.blocks,
            [dateKey]: [...(state.blocks[dateKey] || []), block],
          },
        }));
        return block;
      },

      updateBlock: async (id, updates) => {
        await api.updateBlock(id, updates);
        set(state => {
          const newBlocks = { ...state.blocks };
          for (const dateKey in newBlocks) {
            newBlocks[dateKey] = newBlocks[dateKey].map(b =>
              b.id === id ? { ...b, ...updates } : b
            );
          }
          return { blocks: newBlocks };
        });
      },

      deleteBlock: async (id) => {
        await api.deleteBlock(id);
        set(state => {
          const newBlocks = { ...state.blocks };
          for (const dateKey in newBlocks) {
            newBlocks[dateKey] = newBlocks[dateKey].filter(b => b.id !== id);
          }
          return { blocks: newBlocks };
        });
      },

      autoPlan: async (date) => {
        const response = await api.autoPlan(date);
        return response.proposed_blocks;
      },

      acceptPlan: async (blocks) => {
        await api.acceptPlan(blocks);
        const dateKey = blocks[0]?.start_time.split('T')[0];
        if (dateKey) {
          set(state => ({
            blocks: {
              ...state.blocks,
              [dateKey]: blocks,
            },
          }));
        }
      },
    }),
    {
      name: 'tymblok-schedule',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ blocks: state.blocks, calendarEvents: state.calendarEvents }),
    }
  )
);
```

---

## 7. Desktop App Structure (Tauri)

### 7.1 Project Structure

```
tymblok-desktop/
├── src/                          # React frontend
│   ├── components/               # Shared from mobile (via npm package)
│   ├── pages/
│   │   ├── Today.tsx
│   │   ├── Inbox.tsx
│   │   ├── Week.tsx
│   │   └── Settings.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands.rs           # IPC commands
│   │   ├── tray.rs               # System tray
│   │   └── notifications.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### 7.2 Tauri Configuration

```json
// tauri.conf.json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "Tymblok",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": { "open": true },
      "notification": { "all": true },
      "globalShortcut": { "all": true },
      "clipboard": { "all": true }
    },
    "bundle": {
      "active": true,
      "icon": ["icons/icon.ico", "icons/icon.png"],
      "identifier": "io.tymblok.app",
      "targets": ["msi", "nsis"]
    },
    "windows": [
      {
        "title": "Tymblok",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "systemTray": {
      "iconPath": "icons/tray.png",
      "iconAsTemplate": true
    }
  }
}
```

---

## 8. UI/UX Specifications

### 8.1 Design System

#### Colors

```typescript
// constants/colors.ts
export const colors = {
  // Primary
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    500: '#6366F1',  // Main brand color
    600: '#4F46E5',
    700: '#4338CA',
  },
  
  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Categories
  categories: {
    work: '#6366F1',      // Indigo
    personal: '#8B5CF6',  // Purple
    health: '#10B981',    // Green
    admin: '#F59E0B',     // Amber
  },
  
  // Priority
  priority: {
    critical: '#EF4444',
    high: '#F97316',
    medium: '#F59E0B',
    low: '#22C55E',
  },
  
  // Sources
  sources: {
    manual: '#6366F1',
    github: '#24292E',
    jira: '#0052CC',
    google: '#4285F4',
  },
  
  // Neutral
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};
```

#### Typography

```typescript
// constants/typography.ts
export const typography = {
  fontFamily: {
    sans: 'Inter',
    mono: 'JetBrains Mono',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};
```

#### Spacing & Layout

```typescript
// constants/layout.ts
export const layout = {
  // Time grid
  hourHeight: 60,
  timeColumnWidth: 56,
  blockMinHeight: 15, // 15 minutes
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  // Border radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
};
```

### 8.2 Screen Layouts

#### Day View

```
┌──────────────────────────────────────────────────────┐
│  ◀  Thursday, January 29, 2026  ▶      [+ Add] [⚡]  │
├──────────────────────────────────────────────────────┤
│                                                       │
│  6:00 │                                              │
│  ──────┼──────────────────────────────────────────── │
│  7:00 │                                              │
│  ──────┼──────────────────────────────────────────── │
│  8:00 │  ┌─────────────────────────────────┐        │
│       │  │ 🍳 Breakfast                    │        │
│  ──────┼──│ 30 min · Health                │──────── │
│  9:00 │  └─────────────────────────────────┘        │
│       │  ┌─────────────────────────────────┐        │
│ ──────┼──│ 📅 Sprint Planning              │──────── │
│ 10:00 │  │ 1h · Google Calendar            │        │
│       │  └─────────────────────────────────┘        │
│ ──────┼──────────────────────────────────────────── │
│ 11:00 │  ┌─────────────────────────────────┐        │
│       │  │ 🔍 PR Reviews (3)               │        │
│ ──────┼──│ 1.5h · GitHub                   │──────── │
│ 12:00 │  │ repo/pr#123, repo/pr#456...     │        │
│       │  └─────────────────────────────────┘        │
│ ═══════════════════ 🔴 ════════════════════════════ │ ← Current time
│ 12:30 │  ┌─────────────────────────────────┐        │
│       │  │ 🍽️ Lunch                        │        │
│ ──────┼──│ 1h · Health                     │──────── │
│  1:00 │  └─────────────────────────────────┘        │
│                                                       │
└──────────────────────────────────────────────────────┘
        │                                        │
        │  ┌────────────────────────────────┐   │
        │  │        Jump to Today           │   │
        │  └────────────────────────────────┘   │
        └────────────────────────────────────────┘
```

#### Task Inbox

```
┌──────────────────────────────────────────────────────┐
│  Inbox                           [Filter ▼] [Sort ▼] │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │ 🔴 PR: Fix authentication bug               │    │
│  │    repo/project#234 · 52h old · +120 -45    │    │
│  │    ≈ 45 min                    [Schedule →] │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │ 🟠 JIRA-1234: Implement user settings       │    │
│  │    Sprint 23 · Due in 3 days · 5 points     │    │
│  │    ≈ 4h                        [Schedule →] │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │ 🟡 Review API documentation                 │    │
│  │    Manual task · Medium priority            │    │
│  │    1h                          [Schedule →] │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │ 🟢 PR: Update dependencies                  │    │
│  │    repo/project#567 · 2h old · +5 -3        │    │
│  │    ≈ 15 min                    [Schedule →] │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
├──────────────────────────────────────────────────────┤
│              [⚡ Auto-Schedule All]                   │
└──────────────────────────────────────────────────────┘
```

### 8.3 Gesture Reference

| Gesture | Context | Action |
|---------|---------|--------|
| Swipe horizontal | Day view | Navigate days |
| Pinch | Day view | Zoom time scale |
| Long press | Task card | Initiate drag |
| Drag | Task card | Schedule to time slot |
| Long press | Time block | Initiate move |
| Drag edges | Time block | Resize duration |
| Swipe right | Task/block | Mark complete |
| Swipe left | Task/block | Delete |
| Tap | Task/block | View details |
| Double tap | Task/block | Quick complete |

---

## 9. Third-Party Integrations

### 9.1 Google Calendar

```typescript
// services/oauth/google.ts
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';

const GOOGLE_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  scopes: [
    'openid',
    'profile',
    'email',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
  ],
};

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CONFIG.clientId,
    scopes: GOOGLE_CONFIG.scopes,
  });

  const signIn = async () => {
    const result = await promptAsync();
    if (result.type === 'success') {
      const { authentication } = result;
      // Exchange for Tymblok tokens
      return api.auth.google(authentication.accessToken);
    }
    throw new Error('Google sign-in cancelled');
  };

  return { signIn, isReady: !!request };
}
```

### 9.2 GitHub

```typescript
// services/oauth/github.ts
const GITHUB_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID,
  scopes: ['repo', 'read:user'],
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
};

export async function signInWithGitHub() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'tymblok' });
  
  const authUrl = `${GITHUB_CONFIG.authorizationEndpoint}?` +
    `client_id=${GITHUB_CONFIG.clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `scope=${GITHUB_CONFIG.scopes.join(' ')}`;
  
  const result = await AuthSession.startAsync({ authUrl });
  
  if (result.type === 'success' && result.params.code) {
    return api.auth.github(result.params.code);
  }
  
  throw new Error('GitHub sign-in cancelled');
}
```

### 9.3 Jira

```typescript
// services/oauth/jira.ts
const JIRA_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_JIRA_CLIENT_ID,
  scopes: ['read:jira-work', 'read:jira-user', 'offline_access'],
  authorizationEndpoint: 'https://auth.atlassian.com/authorize',
};

export async function signInWithJira() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'tymblok' });
  
  const authUrl = `${JIRA_CONFIG.authorizationEndpoint}?` +
    `audience=api.atlassian.com&` +
    `client_id=${JIRA_CONFIG.clientId}&` +
    `scope=${encodeURIComponent(JIRA_CONFIG.scopes.join(' '))}&` +
    `redirect_uri=${redirectUri}&` +
    `response_type=code&` +
    `prompt=consent`;
  
  const result = await AuthSession.startAsync({ authUrl });
  
  if (result.type === 'success' && result.params.code) {
    return api.auth.jira(result.params.code);
  }
  
  throw new Error('Jira sign-in cancelled');
}
```

---

## 10. Subscription & Payments

### 10.1 Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Manual tasks, Google Calendar sync, 7-day history |
| **Pro** | $9.99/mo | GitHub + Jira integration, Auto-scheduling, Unlimited history, Analytics |
| **Team** | $14.99/user/mo | Team workspace, Shared visibility, Admin dashboard |

### 10.2 RevenueCat Integration

```typescript
// services/payments/revenueCat.ts
import Purchases, { PurchasesPackage } from 'react-native-purchases';

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

export async function initializePurchases(userId: string) {
  await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
  await Purchases.logIn(userId);
}

export async function getOfferings() {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchasePackage(pkg: PurchasesPackage) {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo.entitlements.active['pro'] !== undefined;
}

export async function restorePurchases() {
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo.entitlements.active;
}

export async function checkSubscriptionStatus() {
  const customerInfo = await Purchases.getCustomerInfo();
  return {
    isPro: customerInfo.entitlements.active['pro'] !== undefined,
    expirationDate: customerInfo.entitlements.active['pro']?.expirationDate,
  };
}
```

### 10.3 Backend Webhook Handler

```csharp
// Controllers/WebhooksController.cs
[ApiController]
[Route("api/webhooks")]
public class WebhooksController : ControllerBase
{
    [HttpPost("revenuecat")]
    public async Task<IActionResult> RevenueCatWebhook([FromBody] RevenueCatEvent evt)
    {
        switch (evt.Type)
        {
            case "INITIAL_PURCHASE":
            case "RENEWAL":
                await _subscriptionService.ActivateSubscription(
                    evt.AppUserId,
                    evt.ProductId,
                    evt.ExpirationAtMs
                );
                break;
                
            case "CANCELLATION":
            case "EXPIRATION":
                await _subscriptionService.DeactivateSubscription(evt.AppUserId);
                break;
        }
        
        return Ok();
    }
}
```

---

## 11. Implementation Phases

### Phase 1: Foundation (MVP) — 8 weeks

**Week 1-2: Project Setup**
- [ ] Initialize React Native project with Expo
- [ ] Set up ASP.NET Core API project
- [ ] Configure PostgreSQL database
- [ ] Set up CI/CD with GitHub Actions
- [ ] Configure Azure resources

**Week 3-4: Authentication**
- [ ] Implement Google OAuth flow
- [ ] Implement GitHub OAuth flow
- [ ] Build JWT token management
- [ ] Create onboarding wizard screens
- [ ] Build account linking

**Week 5-6: Calendar Core**
- [ ] Build DaySwiper component
- [ ] Implement TimeGrid component
- [ ] Create TimeBlock with gestures
- [ ] Add Google Calendar sync (read)
- [ ] Implement current time indicator

**Week 7-8: Manual Tasks**
- [ ] Build task CRUD API
- [ ] Create task form UI
- [ ] Implement recurring tasks
- [ ] Add drag-to-schedule
- [ ] Build task inbox

### Phase 2: Developer Integrations — 6 weeks

**Week 9-10: GitHub Integration**
- [ ] Implement GitHub OAuth
- [ ] Build PR sync service
- [ ] Create PR task cards
- [ ] Add PR staleness tracking

**Week 11-12: Jira Integration**
- [ ] Implement Jira OAuth
- [ ] Build ticket sync service
- [ ] Create Jira task cards
- [ ] Add sprint awareness

**Week 13-14: Smart Inbox**
- [ ] Build unified inbox UI
- [ ] Implement sorting/filtering
- [ ] Add bulk scheduling
- [ ] Create source badges

### Phase 3: Intelligent Scheduling — 4 weeks

**Week 15-16: Auto-Schedule Engine**
- [ ] Build scheduling algorithm
- [ ] Implement task scoring
- [ ] Add context batching
- [ ] Create plan proposal UI

**Week 17-18: Replan & Adapt**
- [ ] Build dynamic replan
- [ ] Implement task carryover
- [ ] Add snooze functionality
- [ ] Create schedule score display

### Phase 4: Polish & Launch — 4 weeks

**Week 19-20: Productivity Features**
- [ ] Build focus mode
- [ ] Create daily review
- [ ] Add week view
- [ ] Implement analytics

**Week 21-22: Payments & Final Polish**
- [ ] Integrate RevenueCat
- [ ] Build subscription UI
- [ ] Add paywall logic
- [ ] Performance optimization
- [ ] Bug fixes

**Week 23-24: Launch Prep**
- [ ] App Store submission
- [ ] Play Store submission
- [ ] Marketing site
- [ ] Documentation

---

## 12. Testing Strategy

### 12.1 Unit Tests

```typescript
// __tests__/utils/scheduling.test.ts
import { calculateTaskScore, findAvailableSlots, batchTasks } from '@/utils/scheduling';

describe('calculateTaskScore', () => {
  it('should prioritize old PRs', () => {
    const oldPR = { source: 'github_pr', created_at: '2026-01-27T00:00:00Z' };
    const newPR = { source: 'github_pr', created_at: '2026-01-29T00:00:00Z' };
    
    expect(calculateTaskScore(oldPR)).toBeGreaterThan(calculateTaskScore(newPR));
  });

  it('should prioritize sprint deadline proximity', () => {
    const urgentTicket = { source: 'jira', sprint_end_date: '2026-01-30' };
    const laterTicket = { source: 'jira', sprint_end_date: '2026-02-15' };
    
    expect(calculateTaskScore(urgentTicket)).toBeGreaterThan(calculateTaskScore(laterTicket));
  });
});

describe('findAvailableSlots', () => {
  it('should respect existing calendar events', () => {
    const events = [
      { start_time: '2026-01-29T10:00:00Z', end_time: '2026-01-29T11:00:00Z' },
    ];
    const slots = findAvailableSlots('2026-01-29', events, '09:00', '17:00');
    
    expect(slots).not.toContainEqual(
      expect.objectContaining({ start: '10:00', end: '11:00' })
    );
  });
});
```

### 12.2 Integration Tests

```csharp
// Tests/Integration/ScheduleControllerTests.cs
public class ScheduleControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task AutoPlan_ShouldRespectWorkingHours()
    {
        // Arrange
        var client = _factory.CreateClient();
        await AuthenticateAsync(client);
        
        // Act
        var response = await client.PostAsJsonAsync("/api/schedule/auto-plan", new
        {
            date = "2026-01-29"
        });
        
        // Assert
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<AutoPlanResponse>();
        
        foreach (var block in result.ProposedBlocks)
        {
            var startHour = DateTime.Parse(block.StartTime).Hour;
            Assert.InRange(startHour, 9, 17);
        }
    }
}
```

### 12.3 E2E Tests

```typescript
// e2e/dayView.test.ts
import { device, element, by, expect } from 'detox';

describe('Day View', () => {
  beforeAll(async () => {
    await device.launchApp();
    await loginWithTestAccount();
  });

  it('should swipe between days', async () => {
    const today = format(new Date(), 'EEEE, MMMM d, yyyy');
    await expect(element(by.text(today))).toBeVisible();
    
    await element(by.id('day-swiper')).swipe('left');
    
    const tomorrow = format(addDays(new Date(), 1), 'EEEE, MMMM d, yyyy');
    await expect(element(by.text(tomorrow))).toBeVisible();
  });

  it('should drag task to schedule', async () => {
    await element(by.id('tab-inbox')).tap();
    
    const taskCard = element(by.id('task-card-1'));
    await taskCard.longPress();
    
    await element(by.id('time-slot-10:00')).tap();
    
    await element(by.id('tab-today')).tap();
    await expect(element(by.text('Test Task'))).toBeVisible();
  });
});
```

---

## 13. Deployment & CI/CD

### 13.1 GitHub Actions Workflow

```yaml
# .github/workflows/main.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-api:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      - run: dotnet restore
      - run: dotnet test --configuration Release

  test-mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm test

  build-api:
    needs: test-api
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: azure/webapps-deploy@v2
        with:
          app-name: tymblok-api
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}

  build-mobile:
    needs: test-mobile
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform all --non-interactive
```

### 13.2 Environment Configuration

```bash
# .env.production (API)
DATABASE_URL=postgresql://user:pass@host:5432/tymblok
REDIS_URL=redis://host:6379
AZURE_STORAGE_CONNECTION_STRING=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
JIRA_CLIENT_ID=...
JIRA_CLIENT_SECRET=...
JWT_SECRET=...

# .env.production (Mobile)
EXPO_PUBLIC_API_URL=https://api.tymblok.io
EXPO_PUBLIC_GOOGLE_CLIENT_ID=...
EXPO_PUBLIC_GITHUB_CLIENT_ID=...
EXPO_PUBLIC_JIRA_CLIENT_ID=...
EXPO_PUBLIC_REVENUECAT_API_KEY=...
```

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| Block | A scheduled time slot on the calendar |
| Task | An item to be done (may or may not be scheduled) |
| Inbox | List of unscheduled tasks |
| Auto-plan | AI-generated schedule proposal |
| Batching | Grouping similar tasks together |
| Staleness | Age of a PR awaiting review |
| Focus time | Protected deep work periods |

---

## Appendix B: Error Codes

| Code | Description |
|------|-------------|
| AUTH_001 | Invalid OAuth code |
| AUTH_002 | Token expired |
| AUTH_003 | Account not linked |
| SYNC_001 | Calendar sync failed |
| SYNC_002 | GitHub API rate limited |
| SYNC_003 | Jira connection error |
| SCHED_001 | No available slots |
| SCHED_002 | Overlap detected |

---

**Document Version:** 1.0  
**Last Updated:** January 29, 2026  
**Author:** Claude (Anthropic)  
**For:** Tymblok Development Team
