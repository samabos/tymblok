# Tymblok Product Requirements Document (PRD)

> Time blocking app built for developers to plan, track, and optimize their workday.

---

## Vision

Tymblok helps developers take control of their time by combining visual time blocking with deep integrations into their existing workflow tools (GitHub, Jira, Calendar). Unlike generic productivity apps, Tymblok understands developer workflows - PRs, tickets, deep work sessions, and meetings.

---

## Target Users

**Primary:** Software developers, engineers, technical leads
**Secondary:** Product managers, designers working with dev teams

**User Persona:**

- Works on multiple projects/repos
- Juggles Jira tickets, PRs, meetings
- Wants focused deep work time
- Tracks time for billing or personal optimization
- Uses 2-3 productivity tools already

---

## Core Features

### F1: Authentication & Onboarding

| ID   | Story                                        | Priority | Acceptance Criteria                                        |
| ---- | -------------------------------------------- | -------- | ---------------------------------------------------------- |
| F1.1 | As a user, I can sign up with email/password | P0       | Email validation, password min 8 chars, email verification |
| F1.2 | As a user, I can sign in with email/password | P0       | JWT token issued, refresh token flow                       |
| F1.3 | As a user, I can sign in with GitHub OAuth   | P1       | OAuth flow, account linking                                |
| F1.4 | As a user, I can sign in with Google OAuth   | P1       | OAuth flow, account linking                                |
| F1.5 | As a user, I can reset my password           | P0       | Email with reset link, 1hr expiry                          |
| F1.6 | As a new user, I see an onboarding flow      | P2       | 3 slides, skippable, shown once                            |

### F2: Time Blocks (Core)

| ID    | Story                                                | Priority | Acceptance Criteria                                  |
| ----- | ---------------------------------------------------- | -------- | ---------------------------------------------------- |
| F2.1  | As a user, I can view my time blocks for today       | P0       | List view, sorted by time, shows title/type/duration |
| F2.2  | As a user, I can create a new time block             | P0       | Title, start time, duration, category required       |
| F2.3  | As a user, I can edit a time block                   | P0       | All fields editable, updates immediately             |
| F2.4  | As a user, I can delete a time block                 | P0       | Confirmation required, soft delete                   |
| F2.5  | As a user, I can mark a time block as complete       | P0       | Updates status, records completion time              |
| F2.6  | As a user, I can reorder time blocks by dragging     | P1       | Drag & drop, updates order in DB                     |
| F2.7  | As a user, I can view blocks for other days          | P1       | Week view navigation, date picker                    |
| F2.8  | As a user, I can see which block is "live" (current) | P1       | Based on current time, visual indicator              |
| F2.9  | As a user, I can track elapsed time on a block       | P2       | Timer starts on expand, pauses on collapse           |
| F2.10 | As a user, I can set a block as "urgent"             | P2       | Visual flag, optional                                |

### F3: Categories & Types

| ID   | Story                                            | Priority | Acceptance Criteria                              |
| ---- | ------------------------------------------------ | -------- | ------------------------------------------------ |
| F3.1 | As a user, I can assign a category to a block    | P0       | Predefined: GitHub, Jira, Meeting, Focus, Custom |
| F3.2 | As a user, I can create custom categories        | P2       | Name, color, icon selection                      |
| F3.3 | As a user, I can see category breakdown in stats | P1       | Pie/bar chart by category                        |

### F4: Inbox

| ID   | Story                                                  | Priority | Acceptance Criteria                  |
| ---- | ------------------------------------------------------ | -------- | ------------------------------------ |
| F4.1 | As a user, I can view unprocessed items in Inbox       | P1       | List from integrations + manual adds |
| F4.2 | As a user, I can filter inbox by source                | P1       | All, Tasks, Updates tabs             |
| F4.3 | As a user, I can add an inbox item to today's schedule | P1       | Opens add modal pre-filled           |
| F4.4 | As a user, I can dismiss an inbox item                 | P1       | Removes from inbox, logged           |
| F4.5 | As a user, I can manually add items to inbox           | P2       | Quick capture without scheduling     |

### F5: Integrations

| ID   | Story                                                 | Priority | Acceptance Criteria                       |
| ---- | ----------------------------------------------------- | -------- | ----------------------------------------- |
| F5.1 | As a user, I can connect my GitHub account            | P1       | OAuth, fetch assigned PRs/issues          |
| F5.2 | As a user, I can connect my Jira account              | P1       | OAuth, fetch assigned tickets             |
| F5.3 | As a user, I can connect Google Calendar              | P2       | OAuth, sync events as blocks              |
| F5.4 | As a user, I can connect Slack                        | P3       | Notifications, status sync                |
| F5.5 | As a user, I can disconnect an integration            | P1       | Revokes access, clears synced data option |
| F5.6 | As a user, I can see which integrations are connected | P1       | Status indicator per integration          |

### F6: Statistics & Insights

| ID   | Story                                             | Priority | Acceptance Criteria            |
| ---- | ------------------------------------------------- | -------- | ------------------------------ |
| F6.1 | As a user, I can see total hours worked this week | P1       | Sum of completed blocks        |
| F6.2 | As a user, I can see tasks completed count        | P1       | Count of completed blocks      |
| F6.3 | As a user, I can see daily hours bar chart        | P1       | Last 7 days                    |
| F6.4 | As a user, I can see time by category breakdown   | P1       | Pie or horizontal bars         |
| F6.5 | As a user, I can see my current streak            | P2       | Days with >= 1 completed block |
| F6.6 | As a user, I can see a "focus score"              | P3       | Algorithm TBD (deep work %)    |

### F7: Settings & Profile

| ID   | Story                                            | Priority | Acceptance Criteria                |
| ---- | ------------------------------------------------ | -------- | ---------------------------------- |
| F7.1 | As a user, I can switch between light/dark theme | P0       | Persisted preference               |
| F7.2 | As a user, I can update my name and email        | P1       | Email change requires verification |
| F7.3 | As a user, I can change my password              | P1       | Requires current password          |
| F7.4 | As a user, I can enable high contrast mode       | P2       | Accessibility                      |
| F7.5 | As a user, I can enable reduced motion           | P2       | Accessibility                      |
| F7.6 | As a user, I can adjust text size                | P2       | Small/Medium/Large                 |
| F7.7 | As a user, I can export my data                  | P3       | JSON/CSV download                  |
| F7.8 | As a user, I can delete my account               | P2       | Confirmation, 30-day grace period  |

### F8: Adaptive Scheduling (Core Differentiator)

| ID   | Story                                                              | Priority | Acceptance Criteria                                                      |
| ---- | ------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------ |
| F8.1 | As a user, my schedule auto-adjusts when a block overruns          | P1       | Downstream blocks shift, conflicts flagged, user confirms or adjusts     |
| F8.2 | As a user, I get smart suggestions for when to schedule deep work  | P1       | Based on historical patterns, meeting gaps, and energy level preferences |
| F8.3 | As a user, I can set energy level preferences per time of day      | P2       | Morning/afternoon/evening energy profiles, influences scheduling         |
| F8.4 | As a user, unfinished blocks carry forward to tomorrow             | P1       | Auto-creates inbox item or next-day block with remaining time            |
| F8.5 | As a user, I see a "reschedule" suggestion when my day derails     | P2       | One-tap reflow of remaining blocks based on available time               |
| F8.6 | As a user, the app learns my scheduling patterns over time         | P2       | Tracks completion rates, preferred times per category, improves suggestions |

### F9: IDE Extension

| ID   | Story                                                                 | Priority | Acceptance Criteria                                                     |
| ---- | --------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------- |
| F9.1 | As a user, I can see my current time block in the IDE status bar      | P1       | VS Code extension, shows block title + time remaining                   |
| F9.2 | As a user, I can start/stop/complete blocks from the IDE              | P1       | Command palette + status bar actions, syncs to mobile in real-time      |
| F9.3 | As a user, I can quick-add a block from the IDE                       | P1       | Command palette "Tymblok: Add Block", opens inline form                 |
| F9.4 | As a user, I see a focus timer in the IDE during deep work blocks     | P2       | Countdown in status bar, optional Pomodoro mode                         |
| F9.5 | As a user, the IDE auto-detects what I'm working on                   | P2       | Reads current branch/file, suggests linking to matching ticket/PR block |
| F9.6 | As a user, I can view my day at a glance in the IDE sidebar           | P2       | Sidebar panel with today's blocks, clickable to navigate                |
| F9.7 | As a user, the extension can set Do Not Disturb during focus blocks   | P3       | Mutes VS Code notifications, optional Slack status sync                 |

### F10: Multi-Source Data Integration

| ID    | Story                                                                    | Priority | Acceptance Criteria                                                  |
| ----- | ------------------------------------------------------------------------ | -------- | -------------------------------------------------------------------- |
| F10.1 | As a user, my GitHub PRs/issues auto-appear in my inbox                  | P1       | Assigned PRs, review requests, mentioned issues - real-time sync     |
| F10.2 | As a user, my Jira tickets auto-appear in my inbox                       | P1       | Assigned tickets, sprint items, watched issues - configurable        |
| F10.3 | As a user, my Google Calendar events auto-create blocks                  | P1       | Two-way sync, calendar events become read-only blocks                |
| F10.4 | As a user, I see a unified timeline merging all sources                  | P1       | Single view: blocks + calendar events + PR deadlines + sprint dates  |
| F10.5 | As a user, I can set rules for auto-scheduling integration items         | P2       | "PR reviews always at 9 AM", "Jira bugs get 30min blocks"           |
| F10.6 | As a user, I can see cross-source context on each block                  | P2       | Block linked to PR shows PR status, comments count, CI status inline |
| F10.7 | As a user, completing a block can trigger actions in connected tools     | P3       | Mark Jira ticket "In Progress", post Slack update, etc.              |
| F10.8 | As a user, I can connect Linear, Notion, Asana as additional sources    | P3       | Plugin architecture for adding new integrations                      |

### F11: Notifications (Future)

| ID    | Story                                                 | Priority | Acceptance Criteria                       |
| ----- | ----------------------------------------------------- | -------- | ----------------------------------------- |
| F11.1 | As a user, I receive a reminder before a block starts | P3       | Push notification, configurable lead time |
| F11.2 | As a user, I receive a notification when a block ends | P3       | Optional                                  |
| F11.3 | As a user, I can configure notification preferences   | P3       | Per-type toggles                          |

---

## Non-Functional Requirements

### Performance

- App load time < 2s on 4G
- API response time < 200ms for reads
- Smooth 60fps animations
- Offline support for viewing today's blocks (P2)

### Security

- HTTPS everywhere
- JWT with short expiry (15min) + refresh tokens
- Password hashing with bcrypt/Argon2
- OAuth state validation
- Rate limiting on auth endpoints
- Input sanitization

### Scalability

- Support 10k concurrent users initially
- Horizontal scaling capability
- Database connection pooling

### Accessibility

- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation (desktop)
- Color contrast ratios

---

## Release Phases

### Phase 1: MVP (4-6 weeks)

- Auth (email/password)
- Time blocks CRUD
- Today view
- Basic stats
- Settings (theme)
- Adaptive scheduling foundations (block overrun detection, carry-forward)

### Phase 2: Integrations & Data (4 weeks)

- GitHub integration (PRs, issues → inbox)
- Jira integration (tickets → inbox)
- Google Calendar two-way sync
- Multi-source unified timeline
- Inbox with cross-source context
- Enhanced stats

### Phase 3: IDE Extension & Polish (3-4 weeks)

- VS Code extension (status bar, command palette, sidebar)
- Auto-detect current branch/file context
- Focus timer in IDE
- Onboarding flow
- Profile management
- Accessibility features

### Phase 4: Adaptive Intelligence (3-4 weeks)

- Smart scheduling suggestions (energy levels, meeting gaps)
- Auto-scheduling rules for integration items
- Pattern learning (completion rates, preferred times)
- One-tap day reflow on schedule derailment

### Phase 5: Growth (Ongoing)

- Slack integration + DND sync
- Linear, Notion, Asana integrations (plugin architecture)
- Cross-tool actions (complete block → update Jira)
- Notifications & reminders
- Team features
- Premium tier

---

## Success Metrics

| Metric                  | Target           |
| ----------------------- | ---------------- |
| Daily Active Users      | 1,000 (6 months) |
| Blocks created/user/day | >= 3             |
| 7-day retention         | >= 40%           |
| App store rating        | >= 4.5           |
| Task completion rate    | >= 70%           |

---

### F12: Subscriptions & Billing

| ID    | Story                                       | Priority | Acceptance Criteria                   |
| ----- | ------------------------------------------- | -------- | ------------------------------------- |
| F12.1 | As a user, I can view subscription plans    | P0       | Free vs Pro comparison                |
| F12.2 | As a user, I can subscribe to Pro plan      | P0       | Stripe checkout, monthly/yearly       |
| F12.3 | As a user, I can manage my subscription     | P1       | View status, cancel, change plan      |
| F12.4 | As a user, I can view billing history       | P2       | List of invoices, download PDF        |
| F12.5 | As a Pro user, I get unlimited integrations | P0       | Free = 1 integration, Pro = unlimited |
| F12.6 | As a Pro user, I get priority support       | P2       | In-app support chat badge             |

**Plan Limits:**

| Feature           | Free   | Pro ($8/mo) |
| ----------------- | ------ | ----------- |
| Time blocks/day   | 10     | Unlimited   |
| Integrations      | 1      | Unlimited   |
| Stats history     | 7 days | Unlimited   |
| Custom categories | 3      | Unlimited   |
| Export data       | ❌     | ✅          |
| Priority support  | ❌     | ✅          |

---

## Out of Scope (v1) → Phase 2 Enhancements

The following features are planned for post-launch Phase 2:

| Feature                         | Priority | Notes                              |
| ------------------------------- | -------- | ---------------------------------- |
| Team/collaboration              | P5.1     | Shared blocks, team stats          |
| Calendar view (week/month)      | P2.1     | Visual calendar interface          |
| Recurring blocks                | P2.2     | Daily/weekly repeat patterns       |
| Time tracking billing/invoicing | P5.2     | Client billing, reports            |
| Desktop menu bar app            | P5.2     | Quick add from menu bar            |
| Browser extension               | P5.3     | Block websites during focus        |
| JetBrains IDE extension         | P3.2     | IntelliJ/WebStorm support          |
| Neovim plugin                   | P5.3     | For terminal-based workflows       |
| Mobile widgets                  | P5.1     | iOS/Android home screen widgets    |

---

_Last updated: January 2026_
