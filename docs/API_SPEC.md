# Tymblok API Specification

> RESTful API contracts for the Tymblok application.

---

## Base Configuration

```
Base URL:     https://api.tymblok.app/v1
Content-Type: application/json
Auth:         Bearer <jwt_token>
```

---

## DTOs & Types

### Shared Types

```typescript
// packages/shared/types.ts

export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    timestamp: string;
    requestId: string;
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  };
}
```

### User DTOs

```typescript
// User
export interface UserDto {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  theme: 'light' | 'dark' | 'system';
  highContrast: boolean;
  reduceMotion: boolean;
  textSize: 'small' | 'medium' | 'large';
  emailVerified: boolean;
  createdAt: string;
}

export interface UpdateUserRequest {
  name?: string;
  avatarUrl?: string | null;
}

export interface UpdateSettingsRequest {
  theme?: 'light' | 'dark' | 'system';
  highContrast?: boolean;
  reduceMotion?: boolean;
  textSize?: 'small' | 'medium' | 'large';
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
```

### Auth DTOs

```typescript
// Auth
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  user: UserDto;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface OAuthCallbackRequest {
  code: string;
  state: string;
}
```

### TimeBlock DTOs

```typescript
// TimeBlock
export interface TimeBlockDto {
  id: string;
  categoryId: string;
  category: CategoryDto;
  title: string;
  subtitle: string | null;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  isUrgent: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  progress: number;
  elapsedSeconds: number;
  sortOrder: number;
  externalId: string | null;
  externalUrl: string | null;
  externalSource: IntegrationProvider | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeBlockRequest {
  categoryId: string;
  title: string;
  subtitle?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMinutes: number;
  isUrgent?: boolean;
}

export interface UpdateTimeBlockRequest {
  categoryId?: string;
  title?: string;
  subtitle?: string;
  date?: string;
  startTime?: string;
  durationMinutes?: number;
  isUrgent?: boolean;
  progress?: number;
  elapsedSeconds?: number;
}

export interface ReorderBlocksRequest {
  date: string;
  blockIds: string[]; // Ordered array of IDs
}

export interface BlocksQueryParams {
  date?: string; // YYYY-MM-DD (default: today)
  startDate?: string;
  endDate?: string;
  completed?: boolean;
}
```

### Category DTOs

```typescript
// Category
export interface CategoryDto {
  id: string;
  name: string;
  color: string; // Hex color
  icon: string;
  isSystem: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  color: string;
  icon: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  color?: string;
  icon?: string;
}
```

### Inbox DTOs

```typescript
// Inbox
export type InboxSource = 'manual' | 'github' | 'jira' | 'google-calendar' | 'slack' | 'google-drive';
export type InboxItemType = 'task' | 'update' | 'reminder' | 'event';
export type InboxPriority = 'normal' | 'high';

export interface InboxItemDto {
  id: string;
  title: string;
  description: string | null;
  source: InboxSource;
  type: InboxItemType;
  priority: InboxPriority;
  externalId: string | null;
  externalUrl: string | null;
  createdAt: string;
}

export interface CreateInboxItemRequest {
  title: string;
  description?: string;
  type?: InboxItemType;
  priority?: InboxPriority;
}

export interface ScheduleInboxItemRequest {
  date: string;
  startTime: string;
  durationMinutes: number;
  categoryId: string;
}

export interface InboxQueryParams {
  source?: InboxSource;
  type?: InboxItemType;
  includeDismissed?: boolean;
}
```

### Integration DTOs

```typescript
// Integration
export type IntegrationProvider = 'github' | 'jira' | 'google-calendar' | 'slack' | 'notion' | 'linear';

export interface IntegrationDto {
  id: string;
  provider: IntegrationProvider;
  externalUsername: string | null;
  externalAvatarUrl: string | null;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  createdAt: string;
}

export interface ConnectIntegrationResponse {
  authUrl: string;
  state: string;
}
```

### Stats DTOs

```typescript
// Stats
export interface StatsSummaryDto {
  period: 'day' | 'week' | 'month';
  totalMinutes: number;
  blocksCompleted: number;
  blocksCreated: number;
  completionRate: number; // percentage
  averageBlockDuration: number;
  comparedToPrevious: {
    minutesDiff: number;
    minutesPercent: number;
    blocksDiff: number;
  };
}

export interface DailyStatsDto {
  date: string;
  totalMinutes: number;
  blocksCompleted: number;
}

export interface CategoryStatsDto {
  categoryId: string;
  category: CategoryDto;
  totalMinutes: number;
  blocksCount: number;
  percentage: number;
}

export interface StreakDto {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string;
}

export interface FocusScoreDto {
  score: number; // 0-100
  breakdown: {
    deepWorkRatio: number;
    completionRate: number;
    consistencyScore: number;
  };
}

export interface StatsQueryParams {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month';
}
```

### Subscription DTOs

```typescript
// Subscriptions
export type PlanId = 'free' | 'pro_monthly' | 'pro_yearly';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface PlanFeaturesDto {
  blocksPerDay: number;      // -1 = unlimited
  integrations: number;       // -1 = unlimited
  statsHistoryDays: number;   // -1 = unlimited
  customCategories: number;   // -1 = unlimited
  exportData: boolean;
  prioritySupport: boolean;
}

export interface PlanDto {
  id: PlanId;
  name: string;
  price: number;             // cents
  interval: 'month' | 'year' | null;
  stripePriceId?: string;
  features: PlanFeaturesDto;
}

export interface SubscriptionDto {
  planId: PlanId;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export interface CreateCheckoutRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionDto {
  checkoutUrl: string;
  sessionId: string;
}

export interface PortalSessionDto {
  portalUrl: string;
}

export interface InvoiceDto {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void';
  pdfUrl: string;
  createdAt: string;
}
```

---

## API Endpoints

### Authentication

#### POST /auth/register
Create a new account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
    "expiresIn": 900,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "avatarUrl": null,
      "theme": "system",
      "emailVerified": false,
      "createdAt": "2026-01-31T10:00:00Z"
    }
  },
  "meta": {
    "timestamp": "2026-01-31T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR` - Invalid input
- `409 CONFLICT` - Email already exists

---

#### POST /auth/login
Authenticate and get tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):** Same as register

**Errors:**
- `401 AUTH_INVALID_CREDENTIALS` - Wrong email/password
- `429 RATE_LIMITED` - Too many attempts

---

#### POST /auth/refresh
Refresh access token.

**Request:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Response (200):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "bmV3IHJlZnJlc2ggdG9r...",
    "expiresIn": 900
  }
}
```

**Errors:**
- `401 AUTH_REFRESH_EXPIRED` - Refresh token expired
- `401 AUTH_TOKEN_INVALID` - Invalid token

---

#### POST /auth/forgot-password
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "data": {
    "message": "If an account exists, a reset email has been sent"
  }
}
```

---

#### POST /auth/reset-password
Reset password with token.

**Request:**
```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!"
}
```

**Response (200):**
```json
{
  "data": {
    "message": "Password reset successfully"
  }
}
```

**Errors:**
- `400 AUTH_TOKEN_INVALID` - Invalid/expired reset token

---

#### GET /auth/oauth/{provider}
Start OAuth flow. Redirects to provider.

**Providers:** `github`, `google`

**Query Params:**
- `redirect_uri` - Where to redirect after auth

**Response:** Redirect to OAuth provider

---

#### POST /auth/oauth/{provider}/callback
Complete OAuth flow.

**Request:**
```json
{
  "code": "oauth_code_from_provider",
  "state": "state_from_initial_request"
}
```

**Response (200):** Same as login response

---

### Users

#### GET /users/me
Get current user profile.

**Response (200):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": "https://...",
    "theme": "dark",
    "highContrast": false,
    "reduceMotion": false,
    "textSize": "medium",
    "emailVerified": true,
    "createdAt": "2026-01-31T10:00:00Z"
  }
}
```

---

#### PATCH /users/me
Update user profile.

**Request:**
```json
{
  "name": "John Smith"
}
```

**Response (200):** Updated user object

---

#### DELETE /users/me
Delete account (soft delete, 30-day grace).

**Response (200):**
```json
{
  "data": {
    "message": "Account scheduled for deletion",
    "deletionDate": "2026-03-02T10:00:00Z"
  }
}
```

---

#### PUT /users/me/password
Change password.

**Request:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

**Response (200):**
```json
{
  "data": {
    "message": "Password changed successfully"
  }
}
```

**Errors:**
- `401 AUTH_INVALID_CREDENTIALS` - Wrong current password

---

### Settings

#### GET /settings
Get user settings.

**Response (200):**
```json
{
  "data": {
    "theme": "dark",
    "highContrast": false,
    "reduceMotion": false,
    "textSize": "medium",
    "notifications": {
      "blockReminder": true,
      "reminderMinutes": 5,
      "dailySummary": true
    }
  }
}
```

---

#### PATCH /settings
Update settings.

**Request:**
```json
{
  "theme": "light",
  "highContrast": true
}
```

**Response (200):** Updated settings

---

### Time Blocks

#### GET /blocks
List time blocks.

**Query Params:**
- `date` - Single date (YYYY-MM-DD)
- `startDate` - Range start
- `endDate` - Range end
- `completed` - Filter by completion

**Response (200):**
```json
{
  "data": [
    {
      "id": "block-uuid-1",
      "categoryId": "cat-uuid",
      "category": {
        "id": "cat-uuid",
        "name": "GitHub",
        "color": "#10b981",
        "icon": "github",
        "isSystem": true
      },
      "title": "Review Pull Requests",
      "subtitle": "Team PR queue",
      "date": "2026-01-31",
      "startTime": "09:00",
      "endTime": "10:30",
      "durationMinutes": 90,
      "isUrgent": false,
      "isCompleted": false,
      "completedAt": null,
      "progress": 0,
      "elapsedSeconds": 0,
      "sortOrder": 1,
      "externalId": null,
      "externalUrl": null,
      "externalSource": null,
      "createdAt": "2026-01-31T08:00:00Z",
      "updatedAt": "2026-01-31T08:00:00Z"
    }
  ]
}
```

---

#### POST /blocks
Create a time block.

**Request:**
```json
{
  "categoryId": "cat-uuid",
  "title": "Code Review",
  "subtitle": "PR #123",
  "date": "2026-01-31",
  "startTime": "14:00",
  "durationMinutes": 60,
  "isUrgent": false
}
```

**Response (201):** Created block object

---

#### GET /blocks/{id}
Get single block.

**Response (200):** Block object

---

#### PATCH /blocks/{id}
Update a block.

**Request:**
```json
{
  "title": "Updated Title",
  "progress": 50
}
```

**Response (200):** Updated block

---

#### DELETE /blocks/{id}
Delete a block.

**Response (204):** No content

---

#### POST /blocks/{id}/complete
Mark block as complete.

**Response (200):**
```json
{
  "data": {
    "id": "block-uuid",
    "isCompleted": true,
    "completedAt": "2026-01-31T10:30:00Z"
  }
}
```

---

#### PUT /blocks/reorder
Reorder blocks for a date.

**Request:**
```json
{
  "date": "2026-01-31",
  "blockIds": ["block-3", "block-1", "block-2"]
}
```

**Response (200):**
```json
{
  "data": {
    "message": "Blocks reordered"
  }
}
```

---

### Categories

#### GET /categories
List all categories.

**Response (200):**
```json
{
  "data": [
    {
      "id": "cat-uuid-1",
      "name": "GitHub",
      "color": "#10b981",
      "icon": "github",
      "isSystem": true
    },
    {
      "id": "cat-uuid-custom",
      "name": "Learning",
      "color": "#8b5cf6",
      "icon": "book",
      "isSystem": false
    }
  ]
}
```

---

#### POST /categories
Create custom category.

**Request:**
```json
{
  "name": "Learning",
  "color": "#8b5cf6",
  "icon": "book"
}
```

**Response (201):** Created category

---

#### PATCH /categories/{id}
Update category.

**Response (200):** Updated category

**Errors:**
- `403 FORBIDDEN` - Cannot edit system categories

---

#### DELETE /categories/{id}
Delete category.

**Response (204):** No content

**Errors:**
- `403 FORBIDDEN` - Cannot delete system categories
- `409 CONFLICT` - Category has blocks (reassign first)

---

### Inbox

#### GET /inbox
List inbox items.

**Query Params:**
- `source` - Filter by source
- `type` - Filter by type
- `includeDismissed` - Include dismissed (default: false)

**Response (200):**
```json
{
  "data": [
    {
      "id": "inbox-uuid",
      "title": "Review Q4 Planning Doc",
      "description": null,
      "source": "google-drive",
      "type": "task",
      "priority": "normal",
      "externalId": "doc-123",
      "externalUrl": "https://docs.google.com/...",
      "createdAt": "2026-01-31T08:00:00Z"
    }
  ]
}
```

---

#### POST /inbox
Create manual inbox item.

**Request:**
```json
{
  "title": "Research caching strategies",
  "type": "task",
  "priority": "normal"
}
```

**Response (201):** Created item

---

#### DELETE /inbox/{id}
Dismiss inbox item.

**Response (204):** No content

---

#### POST /inbox/{id}/schedule
Schedule inbox item as block.

**Request:**
```json
{
  "date": "2026-01-31",
  "startTime": "15:00",
  "durationMinutes": 45,
  "categoryId": "cat-uuid"
}
```

**Response (201):** Created time block

---

### Integrations

#### GET /integrations
List connected integrations.

**Response (200):**
```json
{
  "data": [
    {
      "id": "int-uuid",
      "provider": "github",
      "externalUsername": "johndoe",
      "externalAvatarUrl": "https://github.com/...",
      "lastSyncAt": "2026-01-31T09:00:00Z",
      "lastSyncError": null,
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

#### POST /integrations/{provider}/connect
Start OAuth flow for integration.

**Response (200):**
```json
{
  "data": {
    "authUrl": "https://github.com/login/oauth/authorize?...",
    "state": "random-state-string"
  }
}
```

---

#### DELETE /integrations/{provider}
Disconnect integration.

**Response (204):** No content

---

#### POST /integrations/{provider}/sync
Trigger manual sync.

**Response (200):**
```json
{
  "data": {
    "itemsSynced": 5,
    "lastSyncAt": "2026-01-31T10:00:00Z"
  }
}
```

---

### Stats

#### GET /stats/summary
Get summary statistics.

**Query Params:**
- `period` - day, week, month (default: week)

**Response (200):**
```json
{
  "data": {
    "period": "week",
    "totalMinutes": 2226,
    "blocksCompleted": 51,
    "blocksCreated": 58,
    "completionRate": 87.9,
    "averageBlockDuration": 43.6,
    "comparedToPrevious": {
      "minutesDiff": 240,
      "minutesPercent": 12.1,
      "blocksDiff": 8
    }
  }
}
```

---

#### GET /stats/daily
Get daily breakdown.

**Query Params:**
- `startDate` - Range start (default: 7 days ago)
- `endDate` - Range end (default: today)

**Response (200):**
```json
{
  "data": [
    { "date": "2026-01-25", "totalMinutes": 390, "blocksCompleted": 6 },
    { "date": "2026-01-26", "totalMinutes": 432, "blocksCompleted": 7 },
    { "date": "2026-01-27", "totalMinutes": 348, "blocksCompleted": 5 }
  ]
}
```

---

#### GET /stats/categories
Get category breakdown.

**Query Params:**
- `startDate`, `endDate`

**Response (200):**
```json
{
  "data": [
    {
      "categoryId": "cat-uuid-1",
      "category": { "name": "Deep Work", "color": "#6366f1" },
      "totalMinutes": 1110,
      "blocksCount": 15,
      "percentage": 45
    }
  ]
}
```

---

#### GET /stats/streak
Get streak information.

**Response (200):**
```json
{
  "data": {
    "currentStreak": 12,
    "bestStreak": 28,
    "lastActiveDate": "2026-01-31"
  }
}
```

---

#### GET /stats/focus-score
Get focus score.

**Response (200):**
```json
{
  "data": {
    "score": 85,
    "breakdown": {
      "deepWorkRatio": 0.45,
      "completionRate": 0.88,
      "consistencyScore": 0.92
    }
  }
}
```

---

## Error Responses

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-01-31T10:00:00Z",
    "requestId": "req_xyz789"
  }
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| AUTH_INVALID_CREDENTIALS | 401 | Wrong email/password |
| AUTH_TOKEN_EXPIRED | 401 | JWT has expired |
| AUTH_TOKEN_INVALID | 401 | JWT is malformed |
| AUTH_REFRESH_EXPIRED | 401 | Refresh token expired |
| UNAUTHORIZED | 403 | No permission for action |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict (duplicate) |
| RATE_LIMITED | 429 | Too many requests |
| INTEGRATION_ERROR | 502 | External service failed |
| INTERNAL_ERROR | 500 | Server error |

---

### Subscriptions

#### GET /subscriptions/plans
List available subscription plans.

**Response (200):**
```json
{
  "data": [
    {
      "id": "free",
      "name": "Free",
      "price": 0,
      "interval": null,
      "features": {
        "blocksPerDay": 10,
        "integrations": 1,
        "statsHistoryDays": 7,
        "customCategories": 3,
        "exportData": false,
        "prioritySupport": false
      }
    },
    {
      "id": "pro_monthly",
      "name": "Pro",
      "price": 800,
      "interval": "month",
      "stripePriceId": "price_xxx",
      "features": {
        "blocksPerDay": -1,
        "integrations": -1,
        "statsHistoryDays": -1,
        "customCategories": -1,
        "exportData": true,
        "prioritySupport": true
      }
    },
    {
      "id": "pro_yearly",
      "name": "Pro (Annual)",
      "price": 6800,
      "interval": "year",
      "stripePriceId": "price_yyy",
      "features": { }
    }
  ]
}
```

---

#### GET /subscriptions/current
Get current user's subscription.

**Response (200):**
```json
{
  "data": {
    "planId": "pro_monthly",
    "status": "active",
    "currentPeriodStart": "2026-01-01T00:00:00Z",
    "currentPeriodEnd": "2026-02-01T00:00:00Z",
    "cancelAtPeriodEnd": false,
    "stripeCustomerId": "cus_xxx",
    "stripeSubscriptionId": "sub_xxx"
  }
}
```

---

#### POST /subscriptions/checkout
Create Stripe checkout session.

**Request:**
```json
{
  "priceId": "pro_monthly",
  "successUrl": "tymblok://subscription/success",
  "cancelUrl": "tymblok://subscription/cancel"
}
```

**Response (200):**
```json
{
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/...",
    "sessionId": "cs_xxx"
  }
}
```

---

#### POST /subscriptions/portal
Create Stripe customer portal session.

**Response (200):**
```json
{
  "data": {
    "portalUrl": "https://billing.stripe.com/..."
  }
}
```

---

#### POST /subscriptions/webhook
Stripe webhook handler (internal).

**Events handled:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

---

#### GET /subscriptions/invoices
List billing history.

**Response (200):**
```json
{
  "data": [
    {
      "id": "inv_xxx",
      "amount": 800,
      "currency": "usd",
      "status": "paid",
      "pdfUrl": "https://...",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /auth/* | 10/min per IP |
| All other | 100/min per user |

Headers returned:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706698800
```

---

*Last updated: January 2026*
