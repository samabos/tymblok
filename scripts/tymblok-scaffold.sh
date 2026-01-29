#!/bin/bash

# ============================================================================
# Tymblok Monorepo Scaffold Script
# ============================================================================
# This script creates the complete project structure for the Tymblok app
# using Turborepo + pnpm with React Native (Expo) + Tauri + ASP.NET Core
# ============================================================================

set -e

PROJECT_NAME="tymblok"
PROJECT_DIR="${1:-.}/$PROJECT_NAME"

echo "🚀 Creating Tymblok monorepo at $PROJECT_DIR"

# ============================================================================
# Create directory structure
# ============================================================================

mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Root directories
mkdir -p .github/workflows
mkdir -p docs
mkdir -p scripts
mkdir -p packages/shared/src/{types,utils}
mkdir -p apps/api/src/{Tymblok.Api/{Controllers,Services,Models,Data,Middleware},Tymblok.Core/{Entities,Interfaces,Services},Tymblok.Infrastructure/{Data,Services,Integrations}}
mkdir -p apps/api/tests/{Tymblok.Api.Tests,Tymblok.Integration.Tests}
mkdir -p apps/mobile/{app/{\"(auth)\",\"(tabs)\",task,block},components/{calendar,tasks,schedule,integrations,ui},hooks,stores,services/{api,oauth},utils,constants,types,assets/{images,fonts}}
mkdir -p apps/desktop/{src/{components,pages,hooks,stores},src-tauri/src}

# ============================================================================
# Root package.json
# ============================================================================

cat > package.json << 'EOF'
{
  "name": "tymblok",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@8.15.0",
  "scripts": {
    "dev": "turbo run dev --parallel",
    "dev:mobile": "turbo run dev --filter=@tymblok/mobile",
    "dev:desktop": "turbo run dev --filter=@tymblok/desktop",
    "dev:api": "cd apps/api && dotnet watch run --project src/Tymblok.Api",
    "build": "turbo run build",
    "build:api": "cd apps/api && dotnet build -c Release",
    "build:shared": "turbo run build --filter=@tymblok/shared",
    "test": "turbo run test",
    "test:api": "cd apps/api && dotnet test",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "clean": "turbo run clean && rm -rf node_modules",
    "typecheck": "turbo run typecheck",
    "prepare": "husky install"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.2.0",
    "prettier": "^3.2.0",
    "turbo": "^2.0.0",
    "typescript": "^5.3.0"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
}
EOF

# ============================================================================
# pnpm-workspace.yaml
# ============================================================================

cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/*'
  - 'apps/mobile'
  - 'apps/desktop'
EOF

# ============================================================================
# turbo.json
# ============================================================================

cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local", ".env"],
  "globalEnv": ["NODE_ENV", "CI"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**", ".expo/**"],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "lint": {
      "outputs": [],
      "cache": true
    },
    "lint:fix": {
      "outputs": [],
      "cache": false
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": [],
      "cache": true
    },
    "clean": {
      "cache": false
    }
  }
}
EOF

# ============================================================================
# .nvmrc
# ============================================================================

echo "20" > .nvmrc

# ============================================================================
# .gitignore
# ============================================================================

cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.turbo/
.expo/
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo
.DS_Store

# Testing
coverage/

# .NET
apps/api/**/bin/
apps/api/**/obj/
apps/api/**/*.user
apps/api/**/*.suo
apps/api/.vs/

# Tauri
apps/desktop/src-tauri/target/

# Mobile
apps/mobile/android/
apps/mobile/ios/
*.apk
*.aab
*.ipa

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Misc
.cache/
tmp/
temp/
EOF

# ============================================================================
# .prettierrc
# ============================================================================

cat > .prettierrc << 'EOF'
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
EOF

# ============================================================================
# .prettierignore
# ============================================================================

cat > .prettierignore << 'EOF'
node_modules
dist
build
.turbo
coverage
apps/api
*.lock
EOF

# ============================================================================
# Root tsconfig.json (for IDE support)
# ============================================================================

cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true
  },
  "references": [
    { "path": "./packages/shared" },
    { "path": "./apps/mobile" },
    { "path": "./apps/desktop" }
  ],
  "exclude": ["node_modules", "dist", "build", "apps/api"]
}
EOF

# ============================================================================
# PACKAGES: Shared Types
# ============================================================================

cat > packages/shared/package.json << 'EOF'
{
  "name": "@tymblok/shared",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./types": {
      "import": "./dist/types/index.mjs",
      "require": "./dist/types/index.js",
      "types": "./dist/types/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils/index.mjs",
      "require": "./dist/utils/index.js",
      "types": "./dist/utils/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0"
  },
  "dependencies": {
    "date-fns": "^3.3.0",
    "zod": "^3.22.0"
  }
}
EOF

cat > packages/shared/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

cat > packages/shared/tsup.config.ts << 'EOF'
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/types/index.ts', 'src/utils/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
});
EOF

# Shared types
cat > packages/shared/src/types/index.ts << 'EOF'
// ============================================================================
// Tymblok Shared Types
// ============================================================================

// User & Auth
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
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
EOF

# Shared utils
cat > packages/shared/src/utils/index.ts << 'EOF'
import { format, parseISO, addMinutes, differenceInMinutes, startOfDay, endOfDay } from 'date-fns';
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
    const linesChanged = (task.source_metadata.additions || 0) + (task.source_metadata.deletions || 0);
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
    const linesChanged = (task.source_metadata.additions || 0) + (task.source_metadata.deletions || 0);
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
  const dayEnd = endOfDay(date);

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
EOF

# Shared index
cat > packages/shared/src/index.ts << 'EOF'
export * from './types';
export * from './utils';
EOF

# ============================================================================
# APPS: Mobile (React Native + Expo)
# ============================================================================

cat > apps/mobile/package.json << 'EOF'
{
  "name": "@tymblok/mobile",
  "version": "0.1.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "build": "eas build",
    "build:dev": "eas build --profile development",
    "build:preview": "eas build --profile preview",
    "build:prod": "eas build --profile production",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf .expo dist node_modules/.cache"
  },
  "dependencies": {
    "@tymblok/shared": "workspace:*",
    "expo": "~52.0.0",
    "expo-auth-session": "~6.0.0",
    "expo-crypto": "~14.0.0",
    "expo-linking": "~7.0.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-status-bar": "~2.0.0",
    "expo-web-browser": "~14.0.0",
    "react": "18.3.1",
    "react-native": "0.76.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-pager-view": "6.5.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.1.0",
    "nativewind": "^4.0.0",
    "tailwindcss": "^3.4.0",
    "zustand": "^4.5.0",
    "axios": "^1.6.0",
    "@tanstack/react-query": "^5.17.0",
    "date-fns": "^3.3.0"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@types/react": "~18.3.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "jest": "^29.7.0",
    "jest-expo": "~52.0.0",
    "typescript": "^5.3.0"
  }
}
EOF

cat > apps/mobile/tsconfig.json << 'EOF'
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@tymblok/shared": ["../../packages/shared/src"],
      "@tymblok/shared/*": ["../../packages/shared/src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
EOF

cat > apps/mobile/app.json << 'EOF'
{
  "expo": {
    "name": "Tymblok",
    "slug": "tymblok",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "tymblok",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#6366F1"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "io.tymblok.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#6366F1"
      },
      "package": "io.tymblok.app"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": ["expo-router", "expo-secure-store"],
    "experiments": {
      "typedRoutes": true
    }
  }
}
EOF

cat > apps/mobile/babel.config.js << 'EOF'
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
EOF

cat > apps/mobile/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
      },
    },
  },
  plugins: [],
};
EOF

cat > apps/mobile/global.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

cat > apps/mobile/metro.config.js << 'EOF'
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = withNativeWind(config, { input: './global.css' });
EOF

# Mobile app entry
cat > apps/mobile/app/_layout.tsx << 'EOF'
import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
EOF

cat > 'apps/mobile/app/(tabs)/_layout.tsx' << 'EOF'
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <TabIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color }) => <TabIcon name="inbox" color={color} />,
        }}
      />
      <Tabs.Screen
        name="week"
        options={{
          title: 'Week',
          tabBarIcon: ({ color }) => <TabIcon name="grid" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ name, color }: { name: string; color: string }) {
  return (
    <View className="w-6 h-6 items-center justify-center">
      <Text style={{ color, fontSize: 20 }}>
        {name === 'calendar' ? '📅' : name === 'inbox' ? '📥' : name === 'grid' ? '📊' : '⚙️'}
      </Text>
    </View>
  );
}
EOF

cat > 'apps/mobile/app/(tabs)/today.tsx' << 'EOF'
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TodayScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-primary-600">Today</Text>
        <Text className="text-gray-500 mt-2">Day view coming soon</Text>
      </View>
    </SafeAreaView>
  );
}
EOF

cat > 'apps/mobile/app/(tabs)/inbox.tsx' << 'EOF'
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InboxScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-primary-600">Inbox</Text>
        <Text className="text-gray-500 mt-2">Task inbox coming soon</Text>
      </View>
    </SafeAreaView>
  );
}
EOF

cat > 'apps/mobile/app/(tabs)/week.tsx' << 'EOF'
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WeekScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-primary-600">Week</Text>
        <Text className="text-gray-500 mt-2">Week view coming soon</Text>
      </View>
    </SafeAreaView>
  );
}
EOF

cat > 'apps/mobile/app/(tabs)/settings.tsx' << 'EOF'
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-primary-600">Settings</Text>
        <Text className="text-gray-500 mt-2">Settings coming soon</Text>
      </View>
    </SafeAreaView>
  );
}
EOF

# Mobile stores
cat > apps/mobile/stores/authStore.ts << 'EOF'
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import type { User, AuthTokens } from '@tymblok/shared';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: User, tokens: AuthTokens) => void;
  clearAuth: () => void;
  updateTokens: (tokens: AuthTokens) => void;
  setLoading: (loading: boolean) => void;
}

const secureStorage = {
  getItem: async (name: string) => {
    return SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string) => {
    return SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string) => {
    return SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, tokens) =>
        set({ user, tokens, isAuthenticated: true, isLoading: false }),

      clearAuth: () =>
        set({ user: null, tokens: null, isAuthenticated: false, isLoading: false }),

      updateTokens: (tokens) => set({ tokens }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'tymblok-auth',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ user: state.user, tokens: state.tokens }),
    }
  )
);
EOF

# ============================================================================
# APPS: Desktop (Tauri + React)
# ============================================================================

cat > apps/desktop/package.json << 'EOF'
{
  "name": "@tymblok/desktop",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist src-tauri/target"
  },
  "dependencies": {
    "@tymblok/shared": "workspace:*",
    "@tauri-apps/api": "^2.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zustand": "^4.5.0",
    "axios": "^1.6.0",
    "@tanstack/react-query": "^5.17.0",
    "date-fns": "^3.3.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.57.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
EOF

cat > apps/desktop/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@tymblok/shared": ["../../packages/shared/src"],
      "@tymblok/shared/*": ["../../packages/shared/src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

cat > apps/desktop/tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
EOF

cat > apps/desktop/vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tymblok/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
EOF

cat > apps/desktop/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
      },
    },
  },
  plugins: [],
};
EOF

cat > apps/desktop/postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF

cat > apps/desktop/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tymblok</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

cat > apps/desktop/src/main.tsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

cat > apps/desktop/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

cat > apps/desktop/src/App.tsx << 'EOF'
function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-600">Tymblok</h1>
        <p className="text-gray-500 mt-2">Desktop app coming soon</p>
      </div>
    </div>
  );
}

export default App;
EOF

# Tauri config
cat > apps/desktop/src-tauri/Cargo.toml << 'EOF'
[package]
name = "tymblok"
version = "0.1.0"
description = "Developer-aware time blocking app"
authors = ["Tymblok"]
edition = "2021"

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
EOF

cat > apps/desktop/src-tauri/tauri.conf.json << 'EOF'
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Tymblok",
  "version": "0.1.0",
  "identifier": "io.tymblok.app",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "pnpm build",
    "frontendDist": "../dist"
  },
  "app": {
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
    "trayIcon": {
      "iconPath": "icons/icon.png",
      "iconAsTemplate": true
    },
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
EOF

cat > apps/desktop/src-tauri/src/main.rs << 'EOF'
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
EOF

cat > apps/desktop/src-tauri/build.rs << 'EOF'
fn main() {
    tauri_build::build()
}
EOF

# ============================================================================
# APPS: API (.NET)
# ============================================================================

cat > apps/api/Tymblok.sln << 'EOF'
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.0.31903.59
MinimumVisualStudioVersion = 10.0.40219.1
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Tymblok.Api", "src\Tymblok.Api\Tymblok.Api.csproj", "{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Tymblok.Core", "src\Tymblok.Core\Tymblok.Core.csproj", "{B2C3D4E5-F6A7-8901-BCDE-F12345678901}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Tymblok.Infrastructure", "src\Tymblok.Infrastructure\Tymblok.Infrastructure.csproj", "{C3D4E5F6-A7B8-9012-CDEF-123456789012}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}.Release|Any CPU.Build.0 = Release|Any CPU
		{B2C3D4E5-F6A7-8901-BCDE-F12345678901}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{B2C3D4E5-F6A7-8901-BCDE-F12345678901}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{B2C3D4E5-F6A7-8901-BCDE-F12345678901}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{B2C3D4E5-F6A7-8901-BCDE-F12345678901}.Release|Any CPU.Build.0 = Release|Any CPU
		{C3D4E5F6-A7B8-9012-CDEF-123456789012}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{C3D4E5F6-A7B8-9012-CDEF-123456789012}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{C3D4E5F6-A7B8-9012-CDEF-123456789012}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{C3D4E5F6-A7B8-9012-CDEF-123456789012}.Release|Any CPU.Build.0 = Release|Any CPU
	EndGlobalSection
EndGlobal
EOF

cat > apps/api/src/Tymblok.Api/Tymblok.Api.csproj << 'EOF'
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.0">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\Tymblok.Core\Tymblok.Core.csproj" />
    <ProjectReference Include="..\Tymblok.Infrastructure\Tymblok.Infrastructure.csproj" />
  </ItemGroup>

</Project>
EOF

cat > apps/api/src/Tymblok.Api/Program.cs << 'EOF'
using Tymblok.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddInfrastructure(builder.Configuration);

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
EOF

cat > apps/api/src/Tymblok.Api/Controllers/HealthController.cs << 'EOF'
using Microsoft.AspNetCore.Mvc;

namespace Tymblok.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
    }
}
EOF

cat > apps/api/src/Tymblok.Api/appsettings.json << 'EOF'
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=tymblok;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "Secret": "your-secret-key-at-least-32-characters-long",
    "Issuer": "tymblok",
    "Audience": "tymblok-clients",
    "ExpirationMinutes": 60
  }
}
EOF

cat > apps/api/src/Tymblok.Api/appsettings.Development.json << 'EOF'
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information"
    }
  }
}
EOF

cat > apps/api/src/Tymblok.Core/Tymblok.Core.csproj << 'EOF'
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

</Project>
EOF

cat > apps/api/src/Tymblok.Core/Entities/User.cs << 'EOF'
namespace Tymblok.Core.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Timezone { get; set; } = "UTC";
    public TimeOnly WorkingHoursStart { get; set; } = new(9, 0);
    public TimeOnly WorkingHoursEnd { get; set; } = new(18, 0);
    public TimeOnly LunchStart { get; set; } = new(12, 0);
    public int LunchDurationMinutes { get; set; } = 60;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<OAuthConnection> OAuthConnections { get; set; } = new List<OAuthConnection>();
    public ICollection<Category> Categories { get; set; } = new List<Category>();
    public ICollection<Task> Tasks { get; set; } = new List<Task>();
    public ICollection<ScheduledBlock> ScheduledBlocks { get; set; } = new List<ScheduledBlock>();
}
EOF

cat > apps/api/src/Tymblok.Core/Entities/Task.cs << 'EOF'
namespace Tymblok.Core.Entities;

public class Task
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public int DurationMinutes { get; set; } = 30;
    public string Source { get; set; } = "manual";
    public string? SourceId { get; set; }
    public string? SourceUrl { get; set; }
    public string? SourceMetadata { get; set; } // JSON
    public string Priority { get; set; } = "medium";
    public bool IsRecurring { get; set; }
    public string? RecurrenceRule { get; set; } // JSON
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool IsArchived { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public Category? Category { get; set; }
}
EOF

cat > apps/api/src/Tymblok.Core/Entities/ScheduledBlock.cs << 'EOF'
namespace Tymblok.Core.Entities;

public class ScheduledBlock
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? TaskId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public DateTime? ActualStartTime { get; set; }
    public DateTime? ActualEndTime { get; set; }
    public string Status { get; set; } = "scheduled";
    public string Source { get; set; } = "tymblok";
    public string? ExternalEventId { get; set; }
    public string Color { get; set; } = "#6366F1";
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public Task? Task { get; set; }
}
EOF

cat > apps/api/src/Tymblok.Core/Entities/Category.cs << 'EOF'
namespace Tymblok.Core.Entities;

public class Category
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#6366F1";
    public string? Icon { get; set; }
    public bool IsDefault { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
}
EOF

cat > apps/api/src/Tymblok.Core/Entities/OAuthConnection.cs << 'EOF'
namespace Tymblok.Core.Entities;

public class OAuthConnection
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Provider { get; set; } = string.Empty; // google, github, jira
    public string ProviderUserId { get; set; } = string.Empty;
    public string AccessToken { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public DateTime? TokenExpiresAt { get; set; }
    public string[]? Scopes { get; set; }
    public string? Metadata { get; set; } // JSON
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
}
EOF

cat > apps/api/src/Tymblok.Infrastructure/Tymblok.Infrastructure.csproj << 'EOF'
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.0.0" />
    <PackageReference Include="Microsoft.Extensions.DependencyInjection.Abstractions" Version="8.0.0" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\Tymblok.Core\Tymblok.Core.csproj" />
  </ItemGroup>

</Project>
EOF

cat > apps/api/src/Tymblok.Infrastructure/DependencyInjection.cs << 'EOF'
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Tymblok.Infrastructure.Data;

namespace Tymblok.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<TymblokDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        return services;
    }
}
EOF

cat > apps/api/src/Tymblok.Infrastructure/Data/TymblokDbContext.cs << 'EOF'
using Microsoft.EntityFrameworkCore;
using Tymblok.Core.Entities;
using Task = Tymblok.Core.Entities.Task;

namespace Tymblok.Infrastructure.Data;

public class TymblokDbContext : DbContext
{
    public TymblokDbContext(DbContextOptions<TymblokDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<OAuthConnection> OAuthConnections => Set<OAuthConnection>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Task> Tasks => Set<Task>();
    public DbSet<ScheduledBlock> ScheduledBlocks => Set<ScheduledBlock>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
        });

        modelBuilder.Entity<OAuthConnection>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.Provider }).IsUnique();
            entity.HasOne(e => e.User)
                  .WithMany(u => u.OAuthConnections)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                  .WithMany(u => u.Categories)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Task>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                  .WithMany(u => u.Tasks)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Category)
                  .WithMany()
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ScheduledBlock>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.StartTime, e.EndTime });
            entity.HasOne(e => e.User)
                  .WithMany(u => u.ScheduledBlocks)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Task)
                  .WithMany()
                  .HasForeignKey(e => e.TaskId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
EOF

# ============================================================================
# GitHub Actions
# ============================================================================

cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  test-shared:
    name: Test Shared Package
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @tymblok/shared build
      - run: pnpm --filter @tymblok/shared typecheck

  test-api:
    name: Test API
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: tymblok_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      - run: cd apps/api && dotnet restore
      - run: cd apps/api && dotnet build --no-restore
      - run: cd apps/api && dotnet test --no-build

  test-mobile:
    name: Test Mobile
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @tymblok/shared build
      - run: pnpm --filter @tymblok/mobile typecheck

  build-api:
    name: Build API
    needs: [test-api]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      - run: cd apps/api && dotnet publish -c Release -o ./publish
      - uses: actions/upload-artifact@v4
        with:
          name: api-build
          path: apps/api/publish
EOF

# ============================================================================
# README
# ============================================================================

cat > README.md << 'EOF'
# Tymblok

Developer-aware time blocking application.

## Tech Stack

- **Mobile**: React Native (Expo) + TypeScript
- **Desktop**: Tauri + React
- **Backend**: ASP.NET Core 8
- **Database**: PostgreSQL
- **Monorepo**: Turborepo + pnpm

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- .NET 8 SDK
- PostgreSQL 16
- Rust (for desktop app)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/tymblok.git
cd tymblok

# Install dependencies
pnpm install

# Build shared package
pnpm build:shared

# Setup database
cd apps/api
dotnet ef database update
cd ../..
```

### Development

```bash
# Start all apps in parallel
pnpm dev

# Or start individually
pnpm dev:api      # Backend on http://localhost:5000
pnpm dev:mobile   # Expo dev server
pnpm dev:desktop  # Tauri dev window
```

### Project Structure

```
tymblok/
├── apps/
│   ├── api/          # ASP.NET Core backend
│   ├── mobile/       # React Native (Expo)
│   └── desktop/      # Tauri + React
├── packages/
│   └── shared/       # Shared TypeScript types & utils
└── docs/             # Documentation
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all apps |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all code |
| `pnpm typecheck` | Type check all TypeScript |

## License

Proprietary - All rights reserved
EOF

# ============================================================================
# Done!
# ============================================================================

echo ""
echo "✅ Tymblok monorepo created successfully!"
echo ""
echo "📁 Project structure:"
echo "   $PROJECT_DIR/"
echo "   ├── apps/"
echo "   │   ├── api/        (ASP.NET Core 8)"
echo "   │   ├── mobile/     (React Native + Expo)"
echo "   │   └── desktop/    (Tauri + React)"
echo "   ├── packages/"
echo "   │   └── shared/     (TypeScript types & utils)"
echo "   └── docs/"
echo ""
echo "🚀 Next steps:"
echo ""
echo "   cd $PROJECT_DIR"
echo "   pnpm install"
echo "   pnpm build:shared"
echo ""
echo "   # Start development"
echo "   pnpm dev:api      # Terminal 1: Backend"
echo "   pnpm dev:mobile   # Terminal 2: Mobile app"
echo ""
echo "📚 See docs/TECHNICAL_SPEC.md for full documentation"
echo ""
