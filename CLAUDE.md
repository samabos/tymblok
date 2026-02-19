# CLAUDE.md - Tymblok Project Guide

> This file provides context for Claude Code when working on the Tymblok codebase.

---

## Project Overview

**Tymblok** is a time-blocking productivity app designed for developers. It helps users plan their day with visual time blocks and integrates with tools like GitHub, Jira, and Google Calendar.

**Target Users:** Software developers, engineers, technical leads

**Core Value Proposition:** Unlike generic productivity apps, Tymblok understands developer workflows — PRs, tickets, deep work sessions, and meetings.

---

## Tech Stack

### Backend (apps/api)

- **Runtime:** .NET 10
- **Framework:** ASP.NET Core 10
- **ORM:** Entity Framework Core 10 (Code-First)
- **Database:** PostgreSQL 16
- **Cache:** Redis
- **Auth:** JWT + Refresh Tokens
- **Payments:** Stripe

### Frontend (apps/mobile)

- **Framework:** React Native + Expo (SDK 50+)
- **Navigation:** Expo Router (file-based)
- **State:** Zustand
- **Data Fetching:** TanStack Query
- **Animations:** React Native Reanimated 3
- **Gestures:** React Native Gesture Handler

### Shared Packages

- **@tymblok/ui:** React Native components
- **@tymblok/theme:** Design tokens (colors, typography, spacing)
- **@tymblok/shared:** TypeScript types, Zod validators, utilities
- **@tymblok/api-client:** Typed API client with TanStack Query hooks

### Infrastructure

- **Cloud:** Azure (App Service, PostgreSQL Flexible Server, Redis Cache)
- **CI/CD:** GitHub Actions
- **Monitoring:** Application Insights

---

## Project Structure

```
tymblok/
├── apps/
│   ├── api/                      # ASP.NET Core API
│   │   └── src/
│   │       ├── Tymblok.Api/      # Controllers, Middleware
│   │       ├── Tymblok.Core/     # Entities, Services, Interfaces
│   │       ├── Tymblok.Infrastructure/  # EF Core, Repositories
│   │       └── Tymblok.Shared/   # DTOs
│   ├── mobile/                   # Expo React Native
│   │   └── app/                  # Expo Router screens
│   └── desktop/                  # Tauri (future)
├── packages/
│   ├── ui/                       # Shared components
│   ├── theme/                    # Design tokens
│   ├── shared/                   # Types, validators
│   └── api-client/               # API hooks
├── docs/                         # Project documentation
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_SPEC.md
│   ├── TYMBLOK_UI_SPEC.md
│   ├── PRODUCT_REQUIREMENTS.md
│   ├── IMPLEMENTATION_PLAN.md
│   └── prototype.jsx
└── .github/workflows/            # CI/CD
```

---

## Key Documentation

| Document                  | Purpose                             | When to Reference              |
| ------------------------- | ----------------------------------- | ------------------------------ |
| `ARCHITECTURE.md`         | System design, auth flows, security | API design, infrastructure     |
| `DATABASE_SCHEMA.md`      | EF Core entities, relationships     | Database changes, new entities |
| `API_SPEC.md`             | Endpoint contracts, DTOs            | Implementing/consuming APIs    |
| `TYMBLOK_UI_SPEC.md`      | Design tokens, component specs      | Building UI components         |
| `PRODUCT_REQUIREMENTS.md` | User stories, acceptance criteria   | Understanding features         |
| `IMPLEMENTATION_PLAN.md`  | Task breakdown, prompts             | Starting new tasks             |
| `prototype.jsx`           | Interactive UI prototype            | Visual reference for styling   |

---

## Development Workflow

### Branch Naming

```
feature/{phase}.{task}-{short-description}
Example: feature/1.4-timeblocks-endpoints
```

### Commit Convention

```
feat: add user authentication endpoints
fix: resolve token refresh race condition
test: add unit tests for TimeBlockService
chore: configure eslint for shared packages
docs: update API documentation
```

### Task Workflow

1. Read task from `IMPLEMENTATION_PLAN.md`
2. Create feature branch
3. Implement feature
4. Write tests (>80% coverage)
5. Run linter (`pnpm lint` / `dotnet format`)
6. Commit with conventional commits
7. Push and create PR
8. Ensure CI passes

---

## Code Standards

### API (.NET)

**Project Organization:**

- Controllers: Thin, delegate to services
- Services: Business logic with interfaces
- Repositories: Data access (via EF Core)
- DTOs: Separate from entities, in Tymblok.Shared

**Naming:**

- Async methods: suffix with `Async`
- Interfaces: prefix with `I`
- DTOs: suffix with `Dto`, `Request`, `Response`

**Patterns:**

```csharp
// Controller
[HttpPost]
public async Task<ActionResult<ApiResponse<BlockDto>>> CreateBlock(
    CreateBlockRequest request,
    CancellationToken ct)
{
    var block = await _blockService.CreateAsync(request, UserId, ct);
    return CreatedAtAction(nameof(GetBlock), new { id = block.Id },
        ApiResponse.Success(block));
}

// Service
public async Task<BlockDto> CreateAsync(
    CreateBlockRequest request,
    Guid userId,
    CancellationToken ct)
{
    // Validate plan limits
    await _subscriptionService.EnforceLimitAsync(userId, Feature.BlocksPerDay, ct);

    // Business logic
    var block = new TimeBlock { ... };
    _context.TimeBlocks.Add(block);
    await _context.SaveChangesAsync(ct);

    // Audit log
    await _auditService.LogAsync(AuditAction.Create, block, ct);

    return block.ToDto();
}
```

**Testing:**

- Unit tests for services with mocked dependencies
- Integration tests for endpoints with test database
- Use `WebApplicationFactory` for API tests

### Mobile (React Native)

**Component Structure:**

```typescript
// components/TaskCard.tsx
interface TaskCardProps {
  task: TimeBlockDto;
  onPress?: () => void;
  onComplete?: () => void;
}

export function TaskCard({ task, onPress, onComplete }: TaskCardProps) {
  const { colors } = useTheme();
  // ...
}
```

**Hooks Pattern:**

```typescript
// hooks/useBlocks.ts
export function useBlocks(date: string) {
  return useQuery({
    queryKey: ['blocks', date],
    queryFn: () => api.blocks.list({ date }),
  });
}

export function useCreateBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.blocks.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
    },
  });
}
```

**File Naming:**

- Components: PascalCase (`TaskCard.tsx`)
- Hooks: camelCase with `use` prefix (`useBlocks.ts`)
- Utils: camelCase (`formatTime.ts`)
- Types: PascalCase with descriptive suffix (`TimeBlockDto.ts`)

---

## Common Patterns

### API Response Format

```typescript
// Success
{
  "data": T,
  "meta": { "timestamp": "...", "requestId": "..." }
}

// Error
{
  "error": { "code": "...", "message": "...", "details": [...] },
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

### Plan Limit Enforcement

```csharp
// In services that need plan checks
await _subscriptionService.EnforceLimitAsync(
    userId,
    Feature.BlocksPerDay,  // or IntegrationsCount, StatsHistoryDays, etc.
    cancellationToken
);
// Throws PlanLimitExceededException if over limit
```

### Audit Logging

```csharp
// Log significant actions
await _auditService.LogAsync(
    AuditAction.Create,
    entityType: "TimeBlock",
    entityId: block.Id.ToString(),
    newValues: block,
    cancellationToken
);
```

### Optimistic Updates (Mobile)

```typescript
useMutation({
  mutationFn: api.blocks.complete,
  onMutate: async blockId => {
    await queryClient.cancelQueries({ queryKey: ['blocks'] });
    const previous = queryClient.getQueryData(['blocks']);
    queryClient.setQueryData(['blocks'], old =>
      old?.map(b => (b.id === blockId ? { ...b, isCompleted: true } : b))
    );
    return { previous };
  },
  onError: (err, blockId, context) => {
    queryClient.setQueryData(['blocks'], context?.previous);
  },
});
```

---

## Security Requirements (SOC2)

When implementing features, ensure:

1. **Audit Logging:** Log all data modifications and auth events
2. **Input Validation:** Validate all inputs at API boundary
3. **Authorization:** Check resource ownership before access
4. **Encryption:** Encrypt sensitive data (tokens, PII)
5. **Rate Limiting:** Apply to auth and sensitive endpoints
6. **Error Handling:** Don't leak internal details in errors

---

## Testing Requirements

| Code Type         | Coverage Target | Test Types             |
| ----------------- | --------------- | ---------------------- |
| API Services      | >80%            | Unit tests             |
| API Endpoints     | >70%            | Integration tests      |
| Mobile Components | >70%            | Snapshot + interaction |
| Mobile Hooks      | >80%            | Unit tests             |
| Validators        | 100%            | Unit tests             |

---

## Quick Commands

```bash
# Root
pnpm dev              # Start all apps
pnpm lint             # Lint all packages
pnpm test             # Run all tests
pnpm build            # Build all packages

# API (from apps/api)
dotnet run            # Start API
dotnet test           # Run tests
dotnet ef migrations add <Name>  # Add migration

# Mobile (from apps/mobile)
pnpm start            # Start Expo
pnpm ios              # Run on iOS
pnpm android          # Run on Android
pnpm test             # Run Jest tests

# Docker
docker-compose up -d  # Start PostgreSQL + Redis
```

---

## Environment Variables

### API (.env or appsettings)

```
ConnectionStrings__DefaultConnection=Host=localhost;Database=tymblok_dev;Username=postgres;Password=postgres
ConnectionStrings__Redis=localhost:6379
Jwt__Secret=your-256-bit-secret
Jwt__Issuer=tymblok
Stripe__SecretKey=sk_test_...
Stripe__WebhookSecret=whsec_...
```

### Mobile (.env)

```
EXPO_PUBLIC_API_URL=http://localhost:5000/v1
```

---

## Getting Help

1. **Feature Requirements:** Check `PRODUCT_REQUIREMENTS.md`
2. **API Contracts:** Check `API_SPEC.md`
3. **Database Schema:** Check `DATABASE_SCHEMA.md`
4. **UI Design:** Check `TYMBLOK_UI_SPEC.md` and `prototype.jsx`
5. **Task Details:** Check `IMPLEMENTATION_PLAN.md`

---

## Current Status

### Completed (Phase 0: Foundation)

- [x] Monorepo setup (Turborepo + pnpm)
- [x] Mobile app shell with Expo Router
- [x] Tab navigation (Today, Inbox, Week, Settings)
- [x] Auth placeholder screens (login)
- [x] Backend structure (.NET 10 / EF Core 10)
- [x] Core entities: User, TimeBlock, Category, Integration, InboxItem, RefreshToken
- [x] TymblokDbContext with relationships
- [x] Initial database migration (PostgreSQL)
- [x] Health endpoint (/health)
- [x] NativeWind (Tailwind CSS) configured
- [x] Shared types package (@tymblok/shared)

### Completed (Phase 1.1: Backend Authentication)

- [x] JWT authentication with refresh token rotation
- [x] Auth endpoints (POST /api/auth/register, /login, /refresh)
- [x] TokenService for JWT generation/validation
- [x] PasswordHasher with BCrypt
- [x] AuthService with business logic (Clean Architecture)
- [x] AuthRepository for data access
- [x] Swagger UI with JWT authentication support
- [x] 27 unit and integration tests

### In Progress (Phase 1.2: Frontend Authentication)

- [ ] API service with Axios
- [ ] Login screen with email/password
- [ ] Register screen
- [ ] Connect to auth store (Zustand + SecureStore)
- [ ] Token refresh interceptor

### Not Started Yet (Phase 1.3: Tasks CRUD)

- [ ] Tasks CRUD endpoints (GET/POST/PATCH/DELETE /api/tasks)
- [ ] Schedule blocks CRUD endpoints
- [ ] Categories endpoints

### Not Started Yet (Phase 2: Mobile MVP)

- [ ] Day view calendar UI
- [ ] TimeBlock component (draggable/resizable)
- [ ] Task cards and forms
- [ ] Inbox screen with filtering
- [ ] Settings screen

### Not Started Yet (Phase 3+)

- [ ] Google Calendar sync
- [ ] GitHub integration
- [ ] Jira integration
- [ ] Auto-planning algorithm

---

## Quick Commands (Updated)

```bash
# Development
pnpm dev:mobile       # Start Expo (interactive - press a/w/i)
pnpm dev:api          # Start .NET API with hot reload

# Build & Test
pnpm build            # Build all packages (via turbo)
pnpm test             # Run all tests (via turbo)
pnpm lint             # Lint all code

# Database
cd apps/api
dotnet ef migrations add <Name> --project src/Tymblok.Infrastructure --startup-project src/Tymblok.Api
dotnet ef database update --project src/Tymblok.Infrastructure --startup-project src/Tymblok.Api
```

---

_Last updated: January 2026_
