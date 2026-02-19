# Tymblok UI Specification

> Developer-aware time blocking app for focused productivity.
> Handoff document for implementation in React Native (Expo) + Tauri desktop.

---

## Tech Stack Reference

```
Monorepo: Turborepo + pnpm
├── apps/
│   ├── mobile/          # React Native + Expo
│   ├── desktop/         # Tauri + React
│   └── api/             # ASP.NET Core backend
├── packages/
│   ├── ui/              # Shared components (this spec)
│   └── theme/           # Design tokens
```

---

## Design Tokens

### Colors

```typescript
// packages/theme/colors.ts
export const colors = {
  // Brand
  indigo: {
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
  },
  purple: {
    500: '#a855f7',
    600: '#9333ea',
  },

  // Semantic - Task Types
  taskType: {
    github: '#10b981', // emerald-500
    jira: '#3b82f6', // blue-500
    meeting: '#a855f7', // purple-500
    focus: '#f59e0b', // amber-500
  },

  // Status
  status: {
    urgent: '#ef4444', // red-500
    live: '#6366f1', // indigo-500
    done: '#10b981', // emerald-500
  },

  // Dark Theme
  dark: {
    bg: '#020617', // slate-950
    card: '#0f172a', // slate-900
    border: '#1e293b', // slate-800
    text: '#ffffff',
    textMuted: '#94a3b8', // slate-400
    textFaint: '#64748b', // slate-500
    input: '#1e293b', // slate-800
  },

  // Light Theme
  light: {
    bg: '#f8fafc', // slate-50
    card: '#ffffff',
    border: '#e2e8f0', // slate-200
    text: '#0f172a', // slate-900
    textMuted: '#475569', // slate-600
    textFaint: '#94a3b8', // slate-400
    input: '#f1f5f9', // slate-100
  },
};
```

### Typography

```typescript
// packages/theme/typography.ts
export const typography = {
  fonts: {
    sans: 'Inter', // UI text
    mono: 'JetBrains Mono', // Times, code
  },

  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
  },

  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};
```

### Spacing

```typescript
// packages/theme/spacing.ts
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
};

export const borderRadius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};
```

---

## Component Hierarchy

```
App
├── LoadingScreen
├── OnboardingScreen (3 slides)
├── Auth
│   ├── LoginScreen
│   ├── SignUpScreen
│   └── ForgotPasswordScreen
├── Main (authenticated)
│   ├── TodayScreen
│   │   ├── CollapsibleHeader
│   │   ├── WeekDaySelector
│   │   ├── TaskList
│   │   │   └── TaskCard (draggable)
│   │   └── AddBlockButton
│   ├── InboxScreen
│   │   ├── FilterTabs
│   │   └── InboxItemList
│   ├── StatsScreen
│   │   ├── SummaryCards
│   │   ├── WeeklyChart
│   │   ├── CategoryBreakdown
│   │   └── StreakCard
│   ├── SettingsScreen
│   ├── ProfileScreen
│   └── IntegrationsScreen
├── Modals
│   ├── AddTaskModal (bottom sheet)
│   └── TaskDetailModal
└── Navigation
    └── BottomNav
```

---

## Screens

### 1. Loading Screen

**Purpose:** Initial app load, auth check  
**Duration:** 1.5s simulated, real = until data ready

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│         ┌─────────┐             │
│         │  LOGO   │  (pulsing)  │
│         └─────────┘             │
│                                 │
│         ════════════            │
│         (loading bar)           │
│                                 │
│       Loading your day...       │
│                                 │
└─────────────────────────────────┘
```

**Logo:** Block Tower (4 stacked rounded rectangles + vertical timeline)

---

### 2. Onboarding (3 slides)

| Slide | Icon                  | Title                     | Description                                |
| ----- | --------------------- | ------------------------- | ------------------------------------------ |
| 1     | Block Tower           | Time Blocking Made Simple | Plan your day with visual time blocks      |
| 2     | Code Brackets + Clock | Built for Developers      | Integrates with GitHub, Jira, and calendar |
| 3     | Checkmark Box         | Focus & Ship              | Track deep work, build streaks             |

**Components:**

- Skip button (top right)
- Dot indicators (tappable)
- Continue / Get Started button

---

### 3. Login Screen

```
┌─────────────────────────────────┐
│                                 │
│         ┌─────────┐             │
│         │  LOGO   │  (floating) │
│         └─────────┘             │
│           Tymblok               │
│    Time blocking for devs       │
│                                 │
│  ┌─────────────────────────┐    │
│  │ Email                   │    │
│  ├─────────────────────────┤    │
│  │ Password           👁   │    │
│  └─────────────────────────┘    │
│              Forgot password?   │
│                                 │
│  ┌─────────────────────────┐    │
│  │       Sign in           │    │
│  └─────────────────────────┘    │
│                                 │
│      ─── or continue with ───   │
│                                 │
│  ┌──────────┐  ┌──────────┐     │
│  │  Google  │  │  GitHub  │     │
│  └──────────┘  └──────────┘     │
│                                 │
│    Don't have account? Sign up  │
│                                 │
└─────────────────────────────────┘
```

**States:**

- Default
- Loading (button shows spinner)
- Error (shake input, red border)

---

### 4. Sign Up Screen

Same layout as Login with:

- Back button (top left)
- Full Name field added
- Password hint: "Must be at least 8 characters"
- Terms & Privacy links
- "Already have account? Sign in"

---

### 5. Forgot Password Screen

**States:**

1. **Form:** Email input + Reset Password button
2. **Success:** Check email illustration + confirmation message + Resend option

---

### 6. Today Screen (Main)

```
┌─────────────────────────────────┐
│  Thu, Jan 29         👤  ⚙️    │ <- Collapsible header
├─────────────────────────────────┤
│  M   T   W   T   F   S   S      │ <- Week selector
│  27  28  29  30  31  1   2      │
│          ●                      │
├─────────────────────────────────┤
│  Today · 5 blocks · 6.5h        │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 09:00  GitHub  PR Review │    │
│  │ 90m    Fix auth redirect │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 10:30  Meeting  ● Live   │    │
│  │ 30m    Team standup     │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 11:00  Jira  Urgent      │    │
│  │ 120m   API integration  │    │
│  └─────────────────────────┘    │
│                                 │
│  + Add time block               │
│                                 │
├─────────────────────────────────┤
│  📅    📥(5)   ➕    📊    ⚙️  │ <- Bottom nav
└─────────────────────────────────┘
```

**Task Card States:**

- Default
- Expanded (shows elapsed time, pause/done buttons)
- Completed (muted, checkmark)
- Live/Current (indigo border, pulsing badge)
- Dragging (elevated, opacity)

**Interactions:**

- Single tap → Expand/collapse
- Drag → Reorder
- Expand icon (⤢) → Task Detail Modal
- Swipe left → Quick complete (optional)

---

### 7. Inbox Screen

```
┌─────────────────────────────────┐
│  Inbox                          │
│  Tasks from your integrations   │
├─────────────────────────────────┤
│  [All] [Tasks] [Updates]        │ <- Filter tabs
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐    │
│  │ 🟡 Review Q4 Planning   + ✕ │
│  │    Google Drive · 2h ago    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 🔵 JIRA-923 Fix login  High │
│  │    Jira · 3h ago        + ✕ │
│  └─────────────────────────┘    │
│                                 │
│  Tap + to add to schedule       │
│  Tap ✕ to dismiss               │
│                                 │
└─────────────────────────────────┘
```

**Source Colors:**

- Google Drive: Yellow
- Jira: Blue
- GitHub: White/Black
- Calendar: Purple
- Slack: Pink

**Empty State:** "Inbox zero!" illustration

---

### 8. Stats Screen

```
┌─────────────────────────────────┐
│  Stats                          │
│  Your productivity insights     │
├─────────────────────────────────┤
│  ┌────────────┐ ┌────────────┐  │
│  │ This Week  │ │ Tasks Done │  │
│  │   37.1h    │ │    51      │  │
│  │  ↑ 12%     │ │  ↑ 8 more  │  │
│  └────────────┘ └────────────┘  │
│                                 │
│  Daily Hours                    │
│  ┌─────────────────────────┐    │
│  │  █                       │    │
│  │  █ █   █                 │    │
│  │  █ █ █ █ █ █ █           │    │
│  │  M T W T F S S           │    │
│  └─────────────────────────┘    │
│                                 │
│  Time by Category               │
│  Deep Work    ████████░░ 45%    │
│  Meetings     ██████░░░░ 29%    │
│  Code Review  ████░░░░░░ 16%    │
│  Admin        ██░░░░░░░░ 10%    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 🔥 12 day streak        │    │
│  │    Best: 28 days        │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ Focus Score  [===85===] │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

---

### 9. Settings Screen

```
┌─────────────────────────────────┐
│  ← Settings                     │
├─────────────────────────────────┤
│  APPEARANCE                     │
│  ┌─────────────────────────┐    │
│  │ Theme                   │    │
│  │ [Light] [Dark] [System] │    │
│  └─────────────────────────┘    │
│                                 │
│  ACCESSIBILITY                  │
│  ┌─────────────────────────┐    │
│  │ High Contrast      [○]  │    │
│  │ Reduce Motion      [●]  │    │
│  │ Text Size  [A] [A] [A]  │    │
│  └─────────────────────────┘    │
│                                 │
│  ACCOUNT                        │
│  ┌─────────────────────────┐    │
│  │ Profile              >  │    │
│  │ Notifications        >  │    │
│  │ Calendar Sync        >  │    │
│  │ Integrations         >  │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │       Sign out          │    │ <- Red/danger style
│  └─────────────────────────┘    │
│                                 │
│         Tymblok v1.0.0          │
└─────────────────────────────────┘
```

---

### 10. Profile Screen

```
┌─────────────────────────────────┐
│  ← Profile                      │
├─────────────────────────────────┤
│                                 │
│          ┌──────┐               │
│          │  SA  │  📷           │ <- Avatar with edit
│          └──────┘               │
│          Sam Abos               │
│       sam@tymblok.dev           │
│                                 │
│  PERSONAL INFO          [Edit]  │
│  ┌─────────────────────────┐    │
│  │ Full Name              │    │
│  │ Sam Abos               │    │
│  ├─────────────────────────┤    │
│  │ Email                  │    │
│  │ sam@tymblok.dev        │    │
│  └─────────────────────────┘    │
│                                 │
│  ACTIVITY                       │
│  ┌────────┐┌────────┐┌────────┐ │
│  │  156   ││   12   ││  89h   │ │
│  │ Tasks  ││ Streak ││ Month  │ │
│  └────────┘└────────┘└────────┘ │
│                                 │
│  ACCOUNT                        │
│  ┌─────────────────────────┐    │
│  │ Change Password      >  │    │
│  │ Export Data          >  │    │
│  └─────────────────────────┘    │
│                                 │
│  DANGER ZONE                    │
│  ┌─────────────────────────┐    │
│  │ Sign Out                │    │
│  │ Delete Account          │    │ <- Red style
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

---

### 11. Integrations Screen

```
┌─────────────────────────────────┐
│  ← Integrations                 │
├─────────────────────────────────┤
│  Connect your tools to import   │
│  tasks and sync workflow.       │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 🐙 GitHub    Connected  │    │
│  │    Sync PRs     [Disconnect] │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 🔵 Jira      Connected  │    │
│  │    Import tickets [Disconnect│
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 📅 Google Calendar      │    │
│  │    Sync events  [Connect]   │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 💬 Slack                │    │
│  │    Notifications [Connect]  │
│  └─────────────────────────┘    │
│                                 │
│  API Key                        │
│  ┌─────────────────────────┐    │
│  │ tb_sk_••••••••  [Copy]  │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

---

## Modals

### Add Task Modal (Bottom Sheet)

```
┌─────────────────────────────────┐
│            ━━━━━                │ <- Drag handle
│  New Time Block            ✕    │
│                                 │
│  What are you working on?       │
│  ┌─────────────────────────┐    │
│  │ e.g., Review pull reqs  │    │
│  └─────────────────────────┘    │
│                                 │
│  Start Time       Duration      │
│  ┌──────────┐    ┌──────────┐   │
│  │  09:00   │    │  1 hour  │   │
│  └──────────┘    └──────────┘   │
│                                 │
│  Category                       │
│  [Jira] [GitHub] [Meeting] [Focus]
│                                 │
│  ┌──────────┐  ┌──────────┐     │
│  │  Cancel  │  │ Add Block│     │
│  └──────────┘  └──────────┘     │
└─────────────────────────────────┘
```

**Animation:** Slide up from bottom (300ms ease-out)

---

### Task Detail Modal

```
┌─────────────────────────────────┐
│ ████████████████████████████████│ <- Colored header (task type)
│ │  GitHub                    ✕ ││
│ │  Fix auth redirect issue     ││
│ │  JIRA-923                    ││
│ ████████████████████████████████│
│                                 │
│  ┌──────────┐  ┌──────────┐     │
│  │ Start    │  │ End      │     │
│  │ 09:00    │  │ 10:30    │     │
│  └──────────┘  └──────────┘     │
│                                 │
│  ┌─────────────────────────┐    │
│  │ Status: ● In Progress   │    │
│  │ Progress: 65%           │    │
│  │ ████████████░░░░░░░░░░░ │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌──────────┐  ┌──────────┐     │
│  │   Edit   │  │ Complete │     │
│  └──────────┘  └──────────┘     │
│                                 │
└─────────────────────────────────┘
```

**Animation:** Scale in from center (200ms ease-out)

---

## Shared Components

### 1. Button

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}
```

| Variant   | Style                                |
| --------- | ------------------------------------ |
| primary   | indigo-600 bg, white text, shadow    |
| secondary | slate-800/100 bg, muted text, border |
| danger    | red-500/10 bg, red text              |
| ghost     | transparent, muted text              |

### 2. Input

```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  type: 'text' | 'email' | 'password' | 'time';
  error?: string;
  rightIcon?: ReactNode;
}
```

### 3. Card

```typescript
interface CardProps {
  variant: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
}
```

### 4. Toggle

```typescript
interface ToggleProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
}
```

### 5. Badge

```typescript
interface BadgeProps {
  variant: 'github' | 'jira' | 'meeting' | 'urgent' | 'live' | 'done';
  size: 'sm' | 'md';
}
```

### 6. Avatar

```typescript
interface AvatarProps {
  name: string;
  imageUrl?: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
}
```

### 7. BottomSheet

```typescript
interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  snapPoints?: number[]; // percentages
}
```

### 8. EmptyState

```typescript
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
}
```

### 9. Skeleton

```typescript
interface SkeletonProps {
  variant: 'text' | 'circular' | 'rectangular' | 'card';
  width?: number | string;
  height?: number | string;
}
```

---

## Animations

### Transitions

| Name   | Duration | Easing      | Usage                           |
| ------ | -------- | ----------- | ------------------------------- |
| fast   | 100ms    | ease        | Button press                    |
| normal | 200ms    | ease-out    | Modal, card expand              |
| slow   | 300ms    | ease-in-out | Screen transition, bottom sheet |

### Keyframes

```typescript
// Float animation (logo)
float: {
  '0%, 100%': { transform: 'translateY(0)' },
  '50%': { transform: 'translateY(-10px)' },
}

// Pulse (live badge)
pulse: {
  '0%, 100%': { opacity: 1 },
  '50%': { opacity: 0.5 },
}

// Slide up (bottom sheet)
slideUp: {
  from: { transform: 'translateY(100%)' },
  to: { transform: 'translateY(0)' },
}

// Scale in (modal)
scaleIn: {
  from: { transform: 'scale(0.95)', opacity: 0 },
  to: { transform: 'scale(1)', opacity: 1 },
}
```

---

## Navigation Flow

```
App Launch
    │
    ▼
Loading Screen (1.5s)
    │
    ▼
Authenticated? ──No──► Onboarding ──► Login ◄──► Sign Up
    │                                   │           │
    │                                   ▼           │
   Yes                          Forgot Password ────┘
    │
    ▼
Today Screen ◄─────────────────────────────────────┐
    │                                               │
    ├──► Inbox ◄────────────────────────────────────┤
    │                                               │
    ├──► Stats ◄────────────────────────────────────┤
    │                                               │
    └──► Settings                                   │
            │                                       │
            ├──► Profile ──────────────────────────►│
            │                                       │
            ├──► Integrations ─────────────────────►│
            │                                       │
            └──► Sign Out ──► Login ────────────────┘
```

---

## Data Models (Reference)

```typescript
interface Task {
  id: string;
  title: string;
  subtitle?: string;
  type: 'github' | 'jira' | 'meeting' | 'focus';
  time: string; // "09:00"
  endTime: string; // "10:30"
  completed: boolean;
  urgent?: boolean;
  isNow?: boolean;
  progress?: number; // 0-100
  elapsed?: string; // "00:45"
}

interface InboxItem {
  id: string;
  title: string;
  source: 'google-drive' | 'jira' | 'calendar' | 'github' | 'slack';
  time: string; // "2h ago"
  type: 'task' | 'update' | 'reminder';
  priority?: 'high' | 'normal';
}

interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  icon: string;
}

interface UserStats {
  weeklyHours: number;
  tasksCompleted: number;
  currentStreak: number;
  bestStreak: number;
  focusScore: number;
  categoryBreakdown: {
    name: string;
    hours: number;
    percent: number;
  }[];
}
```

---

## Implementation Priority

### Phase 1: Core (MVP)

1. Theme provider + design tokens
2. Basic components (Button, Input, Card, Badge)
3. Login / Sign Up screens
4. Today screen with static tasks
5. Bottom navigation

### Phase 2: Features

6. Task interactions (expand, drag, complete)
7. Add Task modal
8. Inbox screen
9. Stats screen
10. Settings with theme toggle

### Phase 3: Polish

11. Profile & Integrations screens
12. Task Detail modal
13. Onboarding flow
14. Loading & empty states
15. Animations & micro-interactions

---

## File Structure Suggestion

```
packages/ui/src/
├── components/
│   ├── primitives/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Toggle.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   └── Skeleton.tsx
│   ├── composite/
│   │   ├── TaskCard.tsx
│   │   ├── InboxItem.tsx
│   │   ├── StatCard.tsx
│   │   ├── SettingsRow.tsx
│   │   └── IntegrationCard.tsx
│   ├── navigation/
│   │   ├── BottomNav.tsx
│   │   ├── Header.tsx
│   │   └── BackButton.tsx
│   ├── modals/
│   │   ├── BottomSheet.tsx
│   │   ├── AddTaskModal.tsx
│   │   └── TaskDetailModal.tsx
│   └── feedback/
│       ├── EmptyState.tsx
│       ├── LoadingScreen.tsx
│       └── ErrorBoundary.tsx
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   ├── ForgotPasswordScreen.tsx
│   │   └── OnboardingScreen.tsx
│   ├── main/
│   │   ├── TodayScreen.tsx
│   │   ├── InboxScreen.tsx
│   │   ├── StatsScreen.tsx
│   │   └── SettingsScreen.tsx
│   └── sub/
│       ├── ProfileScreen.tsx
│       └── IntegrationsScreen.tsx
├── hooks/
│   ├── useTheme.ts
│   └── useAnimations.ts
└── index.ts

packages/theme/src/
├── colors.ts
├── typography.ts
├── spacing.ts
├── animations.ts
└── index.ts
```

---

## React Native Considerations

### Libraries to Use

- `react-native-reanimated` - Animations
- `react-native-gesture-handler` - Drag & swipe
- `@gorhom/bottom-sheet` - Bottom sheet modals
- `react-native-safe-area-context` - Safe areas
- `expo-haptics` - Haptic feedback on interactions

### Platform Differences

- Use `Platform.select()` for iOS/Android specifics
- iOS: Use SF Pro fonts as fallback
- Android: Use Roboto as fallback
- Bottom nav: Account for home indicator on iOS

### Tauri Desktop Adaptations

- Larger touch targets not needed (can use tighter spacing)
- Add keyboard shortcuts (Cmd+N for new task, etc.)
- Window controls integration
- System tray for quick access

---

## Prototype Reference

The full interactive prototype is available at:
`/docs/prototype.jsx` (or wherever you place the tymblok-full.jsx file)

This prototype contains all screens, states, and interactions in a single React file that can be rendered in a browser for visual reference.

---

_Generated for Tymblok by Claude • January 2026_
