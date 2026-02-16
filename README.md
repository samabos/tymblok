# Tymblok

Developer-aware time blocking application that intelligently schedules your day by understanding workload from engineering tools (GitHub, Jira) and calendar.

**Domain:** [tymblok.io](https://tymblok.io)

## Why Tymblok?

Unlike generic scheduling apps, Tymblok treats PR review age, sprint deadlines, and code review batching as first-class scheduling signals.

- **Developer-Aware Scheduling** — Understands PR staleness, sprint deadlines, ticket priority
- **Context Batching** — Groups similar tasks (all PR reviews together)
- **Fluid UI** — Smooth day-sliding, drag-and-drop time blocks
- **Smart Replanning** — Adapts when meetings change

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Mobile/Web** | React Native + Expo 52, Expo Router, Zustand, NativeWind |
| **Backend** | ASP.NET Core 10, Entity Framework Core 10, PostgreSQL 16 |
| **Desktop** | Tauri 2.0 + React + Vite (Phase 2) |
| **Infrastructure** | Azure App Service, Redis, GitHub Actions |
| **Monorepo** | Turborepo + pnpm |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- .NET 10 SDK
- PostgreSQL 16
- Rust (for desktop app only)

### Installation

```bash
# Clone the repository
git clone https://github.com/samabos/tymblok.git
cd tymblok

# Install dependencies
pnpm install

# Build shared package
pnpm build:shared
```

### Database Setup

Requires PostgreSQL 16 running (default: `localhost:5435`). Update the connection string in `apps/api/src/Tymblok.Api/appsettings.json` if needed.

```bash
# Install EF Core CLI tools (one-time setup)
dotnet tool install --global dotnet-ef

# Run migrations
cd apps/api
dotnet ef database update --project src/Tymblok.Infrastructure --startup-project src/Tymblok.Api
cd ../..
```

### Development

```bash
# Start all apps in parallel
pnpm dev

# Or start individually
pnpm dev:api      # Backend on http://localhost:5000
pnpm dev:mobile   # Expo dev server (iOS, Android, Web)
pnpm dev:desktop  # Tauri dev window
```

To run on web, press `w` in the Expo dev server.

Install ngrok
If you don't have ngrok installed:

# Using Chocolatey (Windows)
choco install ngrok

# Or download from https://ngrok.com/download

Once api is running start ngrok tunnel
To map localhost:5000 to, open a new terminal and run:

ngrok http 5000

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
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── stores/             # Zustand state stores
│   │   └── services/           # API clients, OAuth
│   └── desktop/                # Tauri + React (Phase 2)
├── packages/
│   ├── shared/                 # Shared TypeScript types & utils
│   ├── theme/                  # Design tokens (colors, typography, spacing)
│   └── ui/                     # Shared React Native UI components
├── docs/                       # Documentation
└── .github/workflows/          # CI/CD pipelines
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all apps in parallel |
| `pnpm dev:api` | Start backend server |
| `pnpm dev:mobile` | Start Expo dev server |
| `pnpm build` | Build all packages |
| `pnpm build:shared` | Build shared package |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all code |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm typecheck` | Type check all TypeScript |
| `pnpm format` | Format with Prettier |
| `pnpm clean` | Clean all build artifacts |

## Documentation

- [Technical Specification](docs/TECHNICAL_SPEC.md) — Complete technical spec with features, schemas, API contracts
- [AI Assistant Guide](CLAUDE.md) — Development guide and codebase reference

## Current Status

### Completed
- Monorepo setup with Turborepo
- `@tymblok/shared` — types and utils package
- `@tymblok/theme` — design tokens (colors, typography, spacing, animations)
- `@tymblok/ui` — Phase 1 UI components (Button, Input, Card, TaskCard, BottomNav, auth screens, etc.)
- Mobile app shell with tab navigation
- ASP.NET API structure with EF Core
- Health endpoint

### In Progress (Phase 1)
- Authentication (Google/GitHub OAuth)
- Calendar UI with drag-and-drop
- Tasks CRUD
- Google Calendar sync

## License

Proprietary - All rights reserved
