# CLAUDE.md - Tymblok AI Assistant Guide

This document provides guidance for AI assistants working with the Tymblok codebase.

## Project Overview

**Tymblok** is a developer-aware time blocking application that intelligently schedules your day by understanding workload from engineering tools (GitHub, Jira) and calendar. Unlike generic scheduling apps, Tymblok treats PR review age, sprint deadlines, and code review batching as first-class scheduling signals.

**Domain:** tymblok.io

### Target Users
- Software developers and engineers
- Engineering team leads
- Technical product managers
- DevOps engineers

### Core Value Proposition
1. **Developer-Aware Scheduling** - Understands PR staleness, sprint deadlines, ticket priority
2. **Context Batching** - Groups similar tasks (all PR reviews together)
3. **Fluid UI** - Smooth day-sliding, drag-and-drop time blocks
4. **Smart Replanning** - Adapts when meetings change

## Technology Stack

### Backend
- **Runtime:** .NET 8
- **Framework:** ASP.NET Core 8 Web API
- **ORM:** Entity Framework Core 8
- **Database:** PostgreSQL 16
- **Cache:** Redis 7
- **Background Jobs:** Hangfire
- **Message Queue:** Azure Service Bus (future)

### Mobile (iOS/Android)
- **Framework:** React Native 0.76+ with Expo
- **Navigation:** Expo Router
- **State Management:** Zustand
- **Animations:** React Native Reanimated 3
- **Gestures:** React Native Gesture Handler
- **Styling:** NativeWind (Tailwind CSS)
- **HTTP Client:** Axios + React Query

### Desktop (Windows)
- **Framework:** Tauri 2.0
- **UI:** React + Vite
- **Shared:** Common TypeScript library

### Infrastructure
- **Hosting:** Azure App Service
- **CDN:** Azure CDN
- **Monitoring:** Application Insights
- **CI/CD:** GitHub Actions
- **Monorepo:** Turborepo + pnpm

## Project Structure

```
tymblok/
├── apps/
│   ├── api/                    # ASP.NET Core 8 backend
│   │   ├── src/
│   │   │   ├── Tymblok.Api/    # Controllers, middleware, DTOs
│   │   │   ├── Tymblok.Core/   # Entities, interfaces, domain logic
│   │   │   └── Tymblok.Infrastructure/  # Data access, external services
│   │   └── tests/
│   ├── mobile/                 # React Native + Expo
│   │   ├── app/                # Expo Router screens
│   │   │   ├── (auth)/         # Auth flow screens
│   │   │   └── (tabs)/         # Main tab screens (today, inbox, week, settings)
│   │   ├── components/         # Reusable UI components
│   │   │   ├── calendar/       # Day view, time blocks, time grid
│   │   │   ├── tasks/          # Task cards, forms, lists
│   │   │   ├── schedule/       # Auto-planning UI
│   │   │   ├── integrations/   # GitHub, Jira cards
│   │   │   └── ui/             # Base components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── stores/             # Zustand state stores
│   │   ├── services/           # API clients, OAuth
│   │   ├── utils/              # Helper functions
│   │   ├── constants/          # Colors, layout, config
│   │   └── types/              # TypeScript types
│   └── desktop/                # Tauri + React
│       ├── src/                # React frontend
│       └── src-tauri/          # Rust backend
├── packages/
│   └── shared/                 # Shared TypeScript types & utils
│       └── src/
│           ├── types/          # Domain models, API types
│           └── utils/          # Date utils, scheduling algorithms
├── docs/                       # Documentation
├── .github/workflows/          # CI/CD pipelines
└── scripts/                    # Build/deploy scripts
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `tymblok-technical-specification.md` | Complete technical spec with features, schemas, API contracts |
| `tymblok-scaffold.sh` | Monorepo scaffolding script |
| `turbo.json` | Turborepo task configuration |
| `pnpm-workspace.yaml` | Workspace package definitions |
| `apps/api/Tymblok.sln` | .NET solution file |

## Development Workflows

### Prerequisites
- Node.js 20+
- pnpm 8+
- .NET 8 SDK
- PostgreSQL 16
- Rust (for desktop app only)

### Setup
```bash
# Install dependencies
pnpm install

# Build shared package first
pnpm build:shared

# Setup database
cd apps/api && dotnet ef database update
```

### Development Commands
```bash
# Start all apps in parallel
pnpm dev

# Start individual apps
pnpm dev:api      # Backend on localhost:5000
pnpm dev:mobile   # Expo dev server
pnpm dev:desktop  # Tauri dev window

# Build
pnpm build              # Build all
pnpm build:api          # Build API
pnpm build:shared       # Build shared package

# Testing
pnpm test               # Run all tests
pnpm test:api           # Run API tests

# Code quality
pnpm lint               # Lint all code
pnpm lint:fix           # Auto-fix lint issues
pnpm typecheck          # Type check all TypeScript
pnpm format             # Format with Prettier

# Clean
pnpm clean              # Clean all build artifacts
```

## Architecture Patterns

### Backend (ASP.NET Core)
- **Clean Architecture**: Core (entities) -> Infrastructure (data) -> API (controllers)
- **Repository Pattern**: Data access through EF Core DbContext
- **Dependency Injection**: Services registered in `DependencyInjection.cs`
- **JWT Authentication**: Token-based auth with refresh tokens

### Mobile (React Native)
- **File-based routing**: Expo Router with `app/` directory
- **State Management**: Zustand stores for auth, schedule, tasks, settings
- **Data Fetching**: React Query for server state
- **Gesture System**: React Native Gesture Handler for drag/drop
- **Animations**: Reanimated 3 for smooth 60fps animations

### Shared Package
- **Type Definitions**: All domain models in `types/index.ts`
- **Utility Functions**: Date helpers, scheduling algorithms in `utils/index.ts`
- **Build Tool**: tsup for CJS/ESM dual builds

## Code Conventions

### TypeScript/JavaScript
- **Style**: Prettier with single quotes, ES5 trailing commas
- **Naming**: camelCase for variables/functions, PascalCase for types/components
- **Imports**: Absolute imports via `@/` path alias
- **State**: Zustand for global, useState for local, React Query for server

### C# (.NET)
- **Naming**: PascalCase for public members, camelCase for private
- **Async**: All I/O operations are async
- **Nullable**: Nullable reference types enabled
- **EF Core**: Code-first migrations

### Styling
- **Mobile**: NativeWind (Tailwind CSS for React Native)
- **Desktop**: Tailwind CSS
- **Colors**: Use predefined color constants from `constants/colors.ts`
- **Layout**: Use spacing constants from `constants/layout.ts`

## Database Schema

### Core Tables
- `users` - User accounts with timezone and working hours preferences
- `oauth_connections` - OAuth provider tokens (Google, GitHub, Jira)
- `categories` - Task categories (work, personal, health, admin)
- `tasks` - Task definitions (manual and from integrations)
- `scheduled_blocks` - Calendar time blocks
- `calendar_events` - Synced Google Calendar events
- `github_pull_requests` - Synced PRs for review
- `jira_tickets` - Synced Jira tickets
- `user_preferences` - User settings
- `daily_metrics` - Analytics data

### Key Relationships
- User -> OAuthConnections (1:N)
- User -> Categories (1:N)
- User -> Tasks (1:N)
- Task -> Category (N:1, optional)
- User -> ScheduledBlocks (1:N)
- ScheduledBlock -> Task (N:1, optional)

## API Design

### Authentication
- `POST /api/auth/google` - Google OAuth exchange
- `POST /api/auth/github` - GitHub OAuth exchange
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/link/{provider}` - Link additional provider

### Core Resources
- `GET/POST /api/tasks` - Task CRUD
- `GET/POST /api/schedule/blocks` - Schedule block CRUD
- `POST /api/schedule/auto-plan` - Generate AI schedule
- `POST /api/schedule/replan` - Replan remaining day

### Integrations
- `POST /api/integrations/google/sync` - Sync Google Calendar
- `POST /api/integrations/github/sync` - Sync GitHub PRs/issues
- `POST /api/integrations/jira/sync` - Sync Jira tickets

## Key Algorithms

### Task Scoring (Auto-Schedule)
Priority score calculation:
- Base priority: critical=100, high=75, medium=50, low=25
- PR staleness: +10 points per 24h age
- Sprint deadline proximity: +50 if due in 1 day, +30 if 2 days
- Large PRs (>500 lines): +5 points
- Large story points (>=5): +10 points

### Time Slot Finding
1. Parse working hours (default 9am-6pm)
2. Mark lunch as busy (default 12pm-1pm)
3. Mark existing calendar events as busy
4. Find gaps >= 15 minutes
5. Return available slots sorted by start time

### Context Batching Rules
- All PR reviews grouped in single block (max 2hr)
- Code reviews scheduled before 11am (configurable)
- Similar Jira tickets grouped by epic/project
- Admin tasks batched to end of day

## Testing Strategy

### Unit Tests
- Backend: xUnit with test fixtures
- Frontend: Jest with jest-expo preset
- Location: `apps/api/tests/` and `__tests__/` directories

### Integration Tests
- Backend: WebApplicationFactory for API testing
- Database: PostgreSQL test containers

### E2E Tests
- Mobile: Detox for React Native
- Test user authentication, day swiping, task scheduling

## Common Tasks for AI Assistants

### Adding a New Feature
1. Update types in `packages/shared/src/types/index.ts`
2. Add backend entity in `apps/api/src/Tymblok.Core/Entities/`
3. Create/update EF Core configuration in DbContext
4. Add API endpoint in `apps/api/src/Tymblok.Api/Controllers/`
5. Add mobile screen in `apps/mobile/app/`
6. Create UI components in `apps/mobile/components/`
7. Update Zustand store if needed

### Adding a New API Endpoint
1. Add DTO types to shared package
2. Create controller in `Tymblok.Api/Controllers/`
3. Add service interface in `Tymblok.Core/Interfaces/`
4. Implement service in `Tymblok.Infrastructure/Services/`
5. Register in DI container

### Adding a New Mobile Screen
1. Create screen file in `apps/mobile/app/`
2. Add to navigation (tabs or stack)
3. Create necessary components in `components/`
4. Add hooks for data fetching in `hooks/`
5. Update stores if needed

### Working with Integrations
- OAuth flows use expo-auth-session
- Tokens stored encrypted via expo-secure-store
- Background sync via API polling (5-15 min intervals)
- External IDs stored in `source_id` fields

## Error Codes Reference

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

## Important Considerations

### Security
- OAuth tokens stored encrypted
- JWT secrets in environment variables
- CORS configured per environment
- Input validation via Zod (frontend) and Data Annotations (backend)

### Performance
- React Query for caching and deduplication
- Zustand persist for offline-first mobile experience
- EF Core query optimization with includes
- Redis caching for frequently accessed data

### Mobile-Specific
- Gesture-based interactions (long press to drag, swipe to complete)
- Haptic feedback at interaction points
- Offline-capable with sync on reconnect
- Respect system theme preferences

## Glossary

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

*Last updated: January 29, 2026*
*For detailed technical specifications, see `tymblok-technical-specification.md`*
