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
