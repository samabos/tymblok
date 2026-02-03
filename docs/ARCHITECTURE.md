# Tymblok Architecture Document

> System design and technical decisions for the Tymblok time blocking application.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├─────────────────────┬─────────────────────┬─────────────────────┤
│   Mobile (Expo)     │   Desktop (Tauri)   │   Web (Future)      │
│   iOS + Android     │   macOS + Windows   │   React SPA         │
└─────────┬───────────┴─────────┬───────────┴─────────┬───────────┘
          │                     │                     │
          └──────────────────── │ ────────────────────┘
                                │
                          HTTPS/REST
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                 │
│                   (ASP.NET Core 10)                              │
├─────────────────────────────────────────────────────────────────┤
│  • JWT Authentication                                            │
│  • Rate Limiting                                                 │
│  • Request Validation                                            │
│  • CORS                                                          │
└─────────────────────────────────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Auth Service   │  │  Core Service   │  │ Integration Svc │
│                 │  │                 │  │                 │
│ • Register      │  │ • TimeBlocks    │  │ • GitHub        │
│ • Login         │  │ • Categories    │  │ • Jira          │
│ • OAuth         │  │ • Inbox         │  │ • Google Cal    │
│ • Refresh       │  │ • Stats         │  │ • Slack         │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  Entity Framework Core 10                                         │
│  Repository Pattern + Unit of Work                               │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│      PostgreSQL         │    │        Redis            │
│                         │    │                         │
│ • Users                 │    │ • Session cache         │
│ • TimeBlocks            │    │ • Rate limit counters   │
│ • Categories            │    │ • Integration tokens    │
│ • Integrations          │    │                         │
│ • InboxItems            │    │                         │
└─────────────────────────┘    └─────────────────────────┘
```

---

## Technology Stack

### Backend
| Component | Technology | Rationale |
|-----------|------------|-----------|
| Runtime | .NET 10 | Performance, C# expertise, long-term support |
| Framework | ASP.NET Core 10 | Mature, fast, great tooling |
| ORM | Entity Framework Core 10 | Code-first, migrations, LINQ |
| Database | PostgreSQL 16 | Reliable, JSON support, free |
| Cache | Redis | Session management, rate limiting |
| Auth | JWT + Refresh Tokens | Stateless, mobile-friendly |
| OAuth | OAuth 2.0 / OIDC | GitHub, Google, Jira integration |

### Frontend (Shared)
| Component | Technology | Rationale |
|-----------|------------|-----------|
| Language | TypeScript | Type safety, shared types with API |
| State | Zustand | Simple, performant, works everywhere |
| API Client | TanStack Query | Caching, optimistic updates |
| Forms | React Hook Form + Zod | Validation, performance |

### Mobile
| Component | Technology | Rationale |
|-----------|------------|-----------|
| Framework | React Native + Expo | Cross-platform, fast iteration |
| Navigation | Expo Router | File-based routing |
| Animations | Reanimated 3 | 60fps native animations |
| Gestures | React Native Gesture Handler | Drag, swipe support |
| Storage | Expo SecureStore | Token storage |

### Desktop
| Component | Technology | Rationale |
|-----------|------------|-----------|
| Framework | Tauri 2.0 | Lightweight, Rust backend |
| UI | React (same as mobile) | Code sharing |
| Storage | Tauri fs + keyring | Secure local storage |

### Infrastructure
| Component | Technology | Rationale |
|-----------|------------|-----------|
| Hosting | Azure App Service | .NET native, easy scaling |
| Database | Azure Database for PostgreSQL | Managed, backups |
| Cache | Azure Cache for Redis | Managed Redis |
| CI/CD | GitHub Actions | Integrated with repo |
| Monitoring | Application Insights | Azure native APM |

---

## Project Structure

```
tymblok/
├── apps/
│   ├── api/                    # ASP.NET Core API
│   │   ├── src/
│   │   │   ├── Tymblok.Api/           # Web API project
│   │   │   │   ├── Controllers/
│   │   │   │   ├── Middleware/
│   │   │   │   ├── Filters/
│   │   │   │   └── Program.cs
│   │   │   ├── Tymblok.Core/          # Domain & business logic
│   │   │   │   ├── Entities/
│   │   │   │   ├── Interfaces/
│   │   │   │   ├── Services/
│   │   │   │   └── Exceptions/
│   │   │   ├── Tymblok.Infrastructure/ # Data access & external
│   │   │   │   ├── Data/
│   │   │   │   │   ├── AppDbContext.cs
│   │   │   │   │   ├── Configurations/
│   │   │   │   │   └── Migrations/
│   │   │   │   ├── Repositories/
│   │   │   │   └── Services/
│   │   │   │       ├── GitHubService.cs
│   │   │   │       ├── JiraService.cs
│   │   │   │       └── GoogleCalendarService.cs
│   │   │   └── Tymblok.Shared/        # DTOs & contracts
│   │   │       ├── DTOs/
│   │   │       ├── Requests/
│   │   │       └── Responses/
│   │   └── tests/
│   │       ├── Tymblok.Api.Tests/
│   │       ├── Tymblok.Core.Tests/
│   │       └── Tymblok.Infrastructure.Tests/
│   │
│   ├── mobile/                 # Expo React Native app
│   │   ├── app/               # Expo Router screens
│   │   │   ├── (auth)/
│   │   │   │   ├── login.tsx
│   │   │   │   ├── signup.tsx
│   │   │   │   └── forgot-password.tsx
│   │   │   ├── (main)/
│   │   │   │   ├── (tabs)/
│   │   │   │   │   ├── index.tsx      # Today
│   │   │   │   │   ├── inbox.tsx
│   │   │   │   │   ├── stats.tsx
│   │   │   │   │   └── settings.tsx
│   │   │   │   ├── profile.tsx
│   │   │   │   └── integrations.tsx
│   │   │   ├── onboarding.tsx
│   │   │   └── _layout.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── services/
│   │
│   └── desktop/                # Tauri app
│       ├── src/               # React UI (shared with mobile)
│       └── src-tauri/         # Rust backend
│
├── packages/
│   ├── ui/                     # Shared UI components
│   │   ├── primitives/
│   │   ├── composite/
│   │   └── index.ts
│   │
│   ├── theme/                  # Design tokens
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── index.ts
│   │
│   ├── api-client/             # Generated/typed API client
│   │   ├── client.ts
│   │   ├── types.ts
│   │   └── hooks.ts
│   │
│   └── shared/                 # Shared utilities
│       ├── constants.ts
│       ├── utils.ts
│       └── validators.ts
│
├── tools/
│   └── scripts/
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## API Design

### Base URL
```
Production: https://api.tymblok.app/v1
Staging:    https://api-staging.tymblok.app/v1
Local:      http://localhost:5000/v1
```

### Authentication
```
Authorization: Bearer <jwt_token>
```

### Response Format
```typescript
// Success
{
  "data": T,
  "meta": {
    "timestamp": "2026-01-31T10:00:00Z",
    "requestId": "uuid"
  }
}

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  },
  "meta": {
    "timestamp": "2026-01-31T10:00:00Z",
    "requestId": "uuid"
  }
}
```

### Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Auth** |
| POST | /auth/register | Create account |
| POST | /auth/login | Get tokens |
| POST | /auth/refresh | Refresh access token |
| POST | /auth/forgot-password | Request reset email |
| POST | /auth/reset-password | Reset with token |
| POST | /auth/oauth/{provider} | OAuth callback |
| **Users** |
| GET | /users/me | Get current user |
| PATCH | /users/me | Update profile |
| DELETE | /users/me | Delete account |
| PUT | /users/me/password | Change password |
| **Time Blocks** |
| GET | /blocks | List blocks (date filter) |
| POST | /blocks | Create block |
| GET | /blocks/{id} | Get block |
| PATCH | /blocks/{id} | Update block |
| DELETE | /blocks/{id} | Delete block |
| POST | /blocks/{id}/complete | Mark complete |
| PUT | /blocks/reorder | Reorder blocks |
| **Categories** |
| GET | /categories | List categories |
| POST | /categories | Create custom |
| PATCH | /categories/{id} | Update |
| DELETE | /categories/{id} | Delete |
| **Inbox** |
| GET | /inbox | List items |
| POST | /inbox | Create item |
| DELETE | /inbox/{id} | Dismiss |
| POST | /inbox/{id}/schedule | Add to schedule |
| **Stats** |
| GET | /stats/summary | Weekly summary |
| GET | /stats/daily | Daily breakdown |
| GET | /stats/categories | By category |
| GET | /stats/streak | Streak info |
| **Integrations** |
| GET | /integrations | List connected |
| POST | /integrations/{provider}/connect | Start OAuth |
| DELETE | /integrations/{provider} | Disconnect |
| POST | /integrations/{provider}/sync | Manual sync |
| **Settings** |
| GET | /settings | Get all settings |
| PATCH | /settings | Update settings |

---

## Authentication Flow

### Email/Password Login
```
┌────────┐          ┌────────┐          ┌────────┐
│ Client │          │  API   │          │   DB   │
└───┬────┘          └───┬────┘          └───┬────┘
    │                   │                   │
    │ POST /auth/login  │                   │
    │ {email, password} │                   │
    │──────────────────>│                   │
    │                   │  Find user        │
    │                   │──────────────────>│
    │                   │<──────────────────│
    │                   │                   │
    │                   │ Verify password   │
    │                   │ Generate JWT      │
    │                   │ Generate refresh  │
    │                   │                   │
    │                   │ Store refresh     │
    │                   │──────────────────>│
    │                   │<──────────────────│
    │                   │                   │
    │ {accessToken,     │                   │
    │  refreshToken,    │                   │
    │  expiresIn}       │                   │
    │<──────────────────│                   │
    │                   │                   │
    │ Store tokens      │                   │
    │ securely          │                   │
```

### Token Refresh
```
┌────────┐          ┌────────┐          ┌────────┐
│ Client │          │  API   │          │ Redis  │
└───┬────┘          └───┬────┘          └───┬────┘
    │                   │                   │
    │ Access token      │                   │
    │ expired           │                   │
    │                   │                   │
    │ POST /auth/refresh│                   │
    │ {refreshToken}    │                   │
    │──────────────────>│                   │
    │                   │  Validate token   │
    │                   │──────────────────>│
    │                   │<──────────────────│
    │                   │                   │
    │                   │ Generate new pair │
    │                   │ Invalidate old    │
    │                   │──────────────────>│
    │                   │                   │
    │ {accessToken,     │                   │
    │  refreshToken}    │                   │
    │<──────────────────│                   │
```

### OAuth Flow (GitHub Example)
```
┌────────┐       ┌────────┐       ┌────────┐       ┌────────┐
│ Client │       │  API   │       │ GitHub │       │   DB   │
└───┬────┘       └───┬────┘       └───┬────┘       └───┬────┘
    │                │                │                │
    │ GET /integrations/github/connect                 │
    │───────────────>│                │                │
    │                │                │                │
    │ Redirect to    │                │                │
    │ GitHub OAuth   │                │                │
    │<───────────────│                │                │
    │                │                │                │
    │ User authorizes│                │                │
    │───────────────────────────────>│                │
    │                │                │                │
    │ Callback with  │                │                │
    │ code           │                │                │
    │───────────────>│                │                │
    │                │ Exchange code  │                │
    │                │───────────────>│                │
    │                │ Access token   │                │
    │                │<───────────────│                │
    │                │                │                │
    │                │ Store integration               │
    │                │────────────────────────────────>│
    │                │                │                │
    │ Success +      │                │                │
    │ JWT tokens     │                │                │
    │<───────────────│                │                │
```

---

## Security & SOC2 Compliance

### SOC2 Trust Principles Implementation

#### 1. Security (CC Series)

**Authentication & Access Control:**
- JWT access tokens: 15 min expiry
- Refresh tokens: 7 day expiry, stored in Redis with rotation
- Multi-factor authentication (MFA) via TOTP (optional, required for Pro)
- Secure storage: Keychain (iOS), Keystore (Android), Keyring (Desktop)
- Session management with device tracking
- Failed login lockout (5 attempts → 15 min lockout)

**API Security:**
- HTTPS only (HSTS enabled, TLS 1.3)
- Rate limiting: 100 req/min per user, 10 req/min for auth endpoints
- Input validation on all endpoints (FluentValidation)
- SQL injection prevention via EF Core parameterization
- XSS prevention via output encoding
- CSRF protection for web clients
- Security headers (CSP, X-Frame-Options, etc.)

**Infrastructure Security:**
- Azure Virtual Network isolation
- Network Security Groups (NSGs)
- Azure DDoS Protection
- Web Application Firewall (WAF)
- Private endpoints for database/Redis

#### 2. Availability (A Series)

**Uptime & Reliability:**
- Target SLA: 99.9% uptime
- Azure App Service with auto-scaling
- Health check endpoints with monitoring
- Graceful degradation patterns

**Disaster Recovery:**
- Database: Geo-redundant backups (daily, 30-day retention)
- Redis: AOF persistence with hourly snapshots
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 1 hour
- Documented DR runbook

**Incident Response:**
- PagerDuty integration for alerts
- Incident severity classification
- Post-incident review process

#### 3. Processing Integrity (PI Series)

**Data Validation:**
- Input validation at API layer
- Business rule validation in services
- Database constraints (foreign keys, check constraints)
- Idempotency keys for critical operations

**Audit Trail:**
- All data modifications logged
- Immutable audit log table
- User action tracking (who, what, when)

#### 4. Confidentiality (C Series)

**Data Classification:**
| Level | Data Types | Protection |
|-------|------------|------------|
| Critical | Passwords, tokens, payment | Hashed/encrypted, no logging |
| Sensitive | Email, name, PII | Encrypted at rest, masked in logs |
| Internal | Blocks, categories | Standard protection |
| Public | Plan features | None required |

**Encryption:**
- At rest: Azure Storage Service Encryption (AES-256)
- In transit: TLS 1.3
- Application-level: AES-256-GCM for integration tokens
- Key management: Azure Key Vault with rotation

**Access Controls:**
- Role-based access control (RBAC) for admin functions
- Principle of least privilege
- Service account separation

#### 5. Privacy (P Series)

**GDPR/CCPA Compliance:**
- Explicit consent collection at registration
- Privacy policy acceptance tracking
- Right to access: Data export endpoint
- Right to erasure: Account deletion with 30-day grace
- Right to portability: JSON/CSV export
- Data Processing Agreement (DPA) available

**Data Retention:**
| Data Type | Retention | Deletion |
|-----------|-----------|----------|
| User account | Until deletion + 30 days | Hard delete |
| Time blocks | 2 years | Anonymize then delete |
| Audit logs | 7 years | Archive then delete |
| Analytics | 1 year | Aggregate then delete |

**Cookie/Tracking:**
- Essential cookies only
- No third-party tracking
- Analytics opt-in

### Audit Logging Schema

```csharp
public class AuditLog
{
    public Guid Id { get; set; }
    public DateTime Timestamp { get; set; }
    
    // Who
    public Guid? UserId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    
    // What
    public string Action { get; set; }          // CREATE, UPDATE, DELETE, LOGIN, etc.
    public string EntityType { get; set; }      // User, TimeBlock, etc.
    public string? EntityId { get; set; }
    
    // Details
    public string? OldValues { get; set; }      // JSON
    public string? NewValues { get; set; }      // JSON
    public string? AdditionalData { get; set; } // JSON
    
    // Result
    public bool Success { get; set; }
    public string? FailureReason { get; set; }
}
```

### Security Monitoring

**Alerts:**
- Failed login spike (>10/min from same IP)
- Privilege escalation attempts
- Unusual data access patterns
- API abuse detection
- Integration token usage anomalies

**Regular Reviews:**
- Weekly: Access log review
- Monthly: Permission audit
- Quarterly: Penetration testing
- Annually: SOC2 Type II audit

### OAuth Security
- State parameter validation
- PKCE for mobile OAuth (required)
- Token scope minimization
- Regular token refresh
- Revocation on disconnect

---

## Caching Strategy

| Data | Cache Location | TTL | Invalidation |
|------|----------------|-----|--------------|
| User session | Redis | 15 min | On logout |
| User profile | Redis | 5 min | On update |
| Today's blocks | Client | 1 min | On mutation |
| Categories | Client | 1 hour | On change |
| Stats | Redis | 5 min | On block complete |
| Integration tokens | Redis | Until expiry | On refresh |

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTH_INVALID_CREDENTIALS | 401 | Wrong email/password |
| AUTH_TOKEN_EXPIRED | 401 | JWT expired |
| AUTH_TOKEN_INVALID | 401 | JWT malformed |
| AUTH_SESSION_EXPIRED | 401 | Session expired |
| AUTH_UNAUTHORIZED | 403 | No permission |
| VALIDATION_ERROR | 400 | Input validation failed |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| INTEGRATION_ERROR | 502 | External service failed |
| INTERNAL_ERROR | 500 | Server error |

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Azure Cloud                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐      ┌─────────────┐                       │
│  │   Azure     │      │   Azure     │                       │
│  │   Front     │─────>│   App       │                       │
│  │   Door      │      │   Service   │                       │
│  │   (CDN+WAF) │      │   (API)     │                       │
│  └─────────────┘      └──────┬──────┘                       │
│                              │                               │
│         ┌────────────────────┼────────────────────┐         │
│         │                    │                    │         │
│         ▼                    ▼                    ▼         │
│  ┌─────────────┐      ┌─────────────┐      ┌───────────┐   │
│  │  PostgreSQL │      │    Redis    │      │  Blob     │   │
│  │  Flexible   │      │    Cache    │      │  Storage  │   │
│  │  Server     │      │             │      │  (files)  │   │
│  └─────────────┘      └─────────────┘      └───────────┘   │
│                                                              │
│  ┌─────────────┐      ┌─────────────┐                       │
│  │ Application │      │   Key       │                       │
│  │ Insights    │      │   Vault     │                       │
│  └─────────────┘      └─────────────┘                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Environments
| Environment | Purpose | URL |
|-------------|---------|-----|
| Development | Local dev | localhost:5000 |
| Staging | Testing | api-staging.tymblok.app |
| Production | Live | api.tymblok.app |

---

## Monitoring & Observability

### Metrics
- Request rate, latency, error rate
- Database query performance
- Cache hit/miss ratio
- Auth success/failure rate
- Integration sync success rate

### Logging
- Structured logging with Serilog
- Log levels: Debug (dev), Info (staging), Warning (prod)
- Request correlation IDs
- PII redaction in logs

### Alerting
- Error rate > 1% (5 min window)
- P95 latency > 500ms
- Database connections > 80%
- Failed login spike detection

---

*Last updated: January 2026*
