# Tymblok Database Schema

> Entity Framework Core Code-First models and database design.

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │   TimeBlock     │       │    Category     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ Id (PK)         │──┐    │ Id (PK)         │    ┌──│ Id (PK)         │
│ Email           │  │    │ UserId (FK)     │────┘  │ UserId (FK)?    │
│ PasswordHash    │  └───>│ CategoryId (FK) │───────│ Name            │
│ Name            │       │ Title           │       │ Color           │
│ AvatarUrl       │       │ Subtitle        │       │ Icon            │
│ Theme           │       │ Date            │       │ IsSystem        │
│ CreatedAt       │       │ StartTime       │       │ CreatedAt       │
│ UpdatedAt       │       │ EndTime         │       └─────────────────┘
└────────┬────────┘       │ Duration        │
         │                │ IsUrgent        │       ┌─────────────────┐
         │                │ IsCompleted     │       │   InboxItem     │
         │                │ CompletedAt     │       ├─────────────────┤
         │                │ Progress        │       │ Id (PK)         │
         │                │ ElapsedSeconds  │    ┌──│ UserId (FK)     │
         │                │ SortOrder       │    │  │ IntegrationId?  │
         │                │ ExternalId      │    │  │ Title           │
         │                │ CreatedAt       │    │  │ Source          │
         │                │ UpdatedAt       │    │  │ ExternalId      │
         │                └─────────────────┘    │  │ ExternalUrl     │
         │                                       │  │ Type            │
         │                ┌─────────────────┐    │  │ Priority        │
         │                │  Integration    │    │  │ IsDismissed     │
         │                ├─────────────────┤    │  │ CreatedAt       │
         │                │ Id (PK)         │────┘  └─────────────────┘
         └───────────────>│ UserId (FK)     │
                          │ Provider        │       ┌─────────────────┐
                          │ AccessToken*    │       │  RefreshToken   │
                          │ RefreshToken*   │       ├─────────────────┤
                          │ TokenExpiry     │       │ Id (PK)         │
                          │ ExternalUserId  │    ┌──│ UserId (FK)     │
                          │ Metadata        │    │  │ Token           │
                          │ LastSyncAt      │    │  │ ExpiresAt       │
                          │ CreatedAt       │    │  │ CreatedAt       │
                          └─────────────────┘    │  │ RevokedAt       │
                                                 │  └─────────────────┘
         ┌───────────────────────────────────────┘
         │
         │                ┌─────────────────┐
         │                │   UserStats     │
         │                ├─────────────────┤
         │                │ Id (PK)         │
         └───────────────>│ UserId (FK)     │
                          │ Date            │
                          │ TotalMinutes    │
                          │ BlocksCompleted │
                          │ CreatedAt       │
                          └─────────────────┘
```

---

## EF Core Entity Models

### User.cs

```csharp
namespace Tymblok.Core.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    
    // Settings
    public Theme Theme { get; set; } = Theme.System;
    public bool HighContrast { get; set; } = false;
    public bool ReduceMotion { get; set; } = false;
    public TextSize TextSize { get; set; } = TextSize.Medium;
    
    // Account status
    public bool EmailVerified { get; set; } = false;
    public DateTime? EmailVerifiedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? DeletedAt { get; set; } // Soft delete
    
    // Navigation properties
    public ICollection<TimeBlock> TimeBlocks { get; set; } = new List<TimeBlock>();
    public ICollection<Category> Categories { get; set; } = new List<Category>();
    public ICollection<Integration> Integrations { get; set; } = new List<Integration>();
    public ICollection<InboxItem> InboxItems { get; set; } = new List<InboxItem>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<UserStats> Stats { get; set; } = new List<UserStats>();
}

public enum Theme
{
    Light,
    Dark,
    System
}

public enum TextSize
{
    Small,
    Medium,
    Large
}
```

### TimeBlock.cs

```csharp
namespace Tymblok.Core.Entities;

public class TimeBlock : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    
    // Scheduling
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int DurationMinutes { get; set; }
    
    // Status
    public bool IsUrgent { get; set; } = false;
    public bool IsCompleted { get; set; } = false;
    public DateTime? CompletedAt { get; set; }
    
    // Tracking
    public int Progress { get; set; } = 0; // 0-100
    public int ElapsedSeconds { get; set; } = 0;
    
    // Ordering
    public int SortOrder { get; set; }
    
    // External reference (from integration)
    public string? ExternalId { get; set; }
    public string? ExternalUrl { get; set; }
    public IntegrationProvider? ExternalSource { get; set; }
}
```

### Category.cs

```csharp
namespace Tymblok.Core.Entities;

public class Category : BaseEntity
{
    public Guid? UserId { get; set; } // Null for system categories
    public User? User { get; set; }
    
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#6366f1"; // Hex color
    public string Icon { get; set; } = "default"; // Icon identifier
    
    public bool IsSystem { get; set; } = false; // System categories can't be deleted
    
    // Navigation
    public ICollection<TimeBlock> TimeBlocks { get; set; } = new List<TimeBlock>();
}
```

### Integration.cs

```csharp
namespace Tymblok.Core.Entities;

public class Integration : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public IntegrationProvider Provider { get; set; }
    
    // OAuth tokens (encrypted at rest)
    public string AccessToken { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public DateTime? TokenExpiresAt { get; set; }
    
    // External account info
    public string ExternalUserId { get; set; } = string.Empty;
    public string? ExternalUsername { get; set; }
    public string? ExternalAvatarUrl { get; set; }
    
    // Sync state
    public DateTime? LastSyncAt { get; set; }
    public string? LastSyncError { get; set; }
    
    // Provider-specific metadata (JSON)
    public string? Metadata { get; set; }
    
    // Navigation
    public ICollection<InboxItem> InboxItems { get; set; } = new List<InboxItem>();
}

public enum IntegrationProvider
{
    GitHub,
    Jira,
    GoogleCalendar,
    Slack,
    Notion,
    Linear
}
```

### InboxItem.cs

```csharp
namespace Tymblok.Core.Entities;

public class InboxItem : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public Guid? IntegrationId { get; set; }
    public Integration? Integration { get; set; }
    
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    public InboxSource Source { get; set; }
    public InboxItemType Type { get; set; }
    public InboxPriority Priority { get; set; } = InboxPriority.Normal;
    
    // External reference
    public string? ExternalId { get; set; }
    public string? ExternalUrl { get; set; }
    
    // Status
    public bool IsDismissed { get; set; } = false;
    public DateTime? DismissedAt { get; set; }
    public bool IsScheduled { get; set; } = false;
    public Guid? ScheduledBlockId { get; set; }
}

public enum InboxSource
{
    Manual,
    GitHub,
    Jira,
    GoogleCalendar,
    Slack,
    GoogleDrive
}

public enum InboxItemType
{
    Task,
    Update,
    Reminder,
    Event
}

public enum InboxPriority
{
    Normal,
    High
}
```

### RefreshToken.cs

```csharp
namespace Tymblok.Core.Entities;

public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? ReplacedByToken { get; set; }
    
    public string? CreatedByIp { get; set; }
    public string? RevokedByIp { get; set; }
    
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsRevoked => RevokedAt != null;
    public bool IsActive => !IsRevoked && !IsExpired;
}
```

### UserStats.cs

```csharp
namespace Tymblok.Core.Entities;

public class UserStats : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public DateOnly Date { get; set; }
    
    public int TotalMinutes { get; set; } = 0;
    public int BlocksCompleted { get; set; } = 0;
    public int BlocksCreated { get; set; } = 0;
    
    // Category breakdown (JSON)
    public string? CategoryBreakdown { get; set; }
}
```

### Subscription.cs

```csharp
namespace Tymblok.Core.Entities;

public class Subscription : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public SubscriptionPlan Plan { get; set; } = SubscriptionPlan.Free;
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;
    
    // Stripe references
    public string? StripeCustomerId { get; set; }
    public string? StripeSubscriptionId { get; set; }
    public string? StripePriceId { get; set; }
    
    // Billing period
    public DateTime? CurrentPeriodStart { get; set; }
    public DateTime? CurrentPeriodEnd { get; set; }
    public bool CancelAtPeriodEnd { get; set; } = false;
    
    // Trial
    public DateTime? TrialStart { get; set; }
    public DateTime? TrialEnd { get; set; }
}

public enum SubscriptionPlan
{
    Free,
    ProMonthly,
    ProYearly
}

public enum SubscriptionStatus
{
    Active,
    Canceled,
    PastDue,
    Trialing,
    Incomplete
}
```

### Invoice.cs

```csharp
namespace Tymblok.Core.Entities;

public class Invoice : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public string StripeInvoiceId { get; set; } = string.Empty;
    public int AmountPaid { get; set; } // cents
    public string Currency { get; set; } = "usd";
    public InvoiceStatus Status { get; set; }
    public string? PdfUrl { get; set; }
    public string? HostedInvoiceUrl { get; set; }
    
    public DateTime InvoiceDate { get; set; }
    public DateTime? PaidAt { get; set; }
}

public enum InvoiceStatus
{
    Draft,
    Open,
    Paid,
    Void,
    Uncollectible
}
```

### BaseEntity.cs

```csharp
namespace Tymblok.Core.Entities;

public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

---

## SOC2 Compliance Entities

### AuditLog.cs

```csharp
namespace Tymblok.Core.Entities;

/// <summary>
/// Immutable audit trail for SOC2 compliance.
/// Records all significant system actions.
/// </summary>
public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    // Actor
    public Guid? UserId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? SessionId { get; set; }
    
    // Action
    public AuditAction Action { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    
    // Change Details (JSON, null for reads)
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? AdditionalData { get; set; }
    
    // Result
    public bool Success { get; set; } = true;
    public string? FailureReason { get; set; }
    
    // Request context
    public string? RequestId { get; set; }
    public string? Endpoint { get; set; }
}

public enum AuditAction
{
    // Auth
    Login,
    LoginFailed,
    Logout,
    Register,
    PasswordChange,
    PasswordReset,
    MfaEnabled,
    MfaDisabled,
    
    // Data
    Create,
    Read,
    Update,
    Delete,
    
    // Admin
    Export,
    Import,
    
    // Subscription
    Subscribe,
    Unsubscribe,
    PlanChange,
    
    // Integration
    IntegrationConnect,
    IntegrationDisconnect,
    IntegrationSync,
    
    // Account
    AccountDelete,
    ConsentGiven,
    ConsentWithdrawn
}
```

### UserConsent.cs

```csharp
namespace Tymblok.Core.Entities;

/// <summary>
/// Tracks user consent for GDPR/CCPA compliance.
/// </summary>
public class UserConsent : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public ConsentType Type { get; set; }
    public string Version { get; set; } = string.Empty;  // e.g., "privacy-policy-v1.2"
    
    public bool Granted { get; set; }
    public DateTime GrantedAt { get; set; }
    public DateTime? WithdrawnAt { get; set; }
    
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}

public enum ConsentType
{
    PrivacyPolicy,
    TermsOfService,
    MarketingEmails,
    Analytics,
    ThirdPartySharing
}
```

### UserSession.cs

```csharp
namespace Tymblok.Core.Entities;

/// <summary>
/// Tracks active user sessions for security monitoring.
/// </summary>
public class UserSession : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public string SessionId { get; set; } = string.Empty;
    public string RefreshTokenId { get; set; } = string.Empty;
    
    // Device info
    public string? DeviceType { get; set; }      // mobile, desktop, web
    public string? DeviceName { get; set; }      // "iPhone 15 Pro", "Chrome on Windows"
    public string? IpAddress { get; set; }
    public string? Location { get; set; }        // Geo-IP lookup
    
    // Status
    public bool IsActive { get; set; } = true;
    public DateTime LastActiveAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? RevokedReason { get; set; }   // "user_logout", "password_change", "admin_revoke"
}
```

### UserMfa.cs

```csharp
namespace Tymblok.Core.Entities;

/// <summary>
/// Multi-factor authentication settings.
/// </summary>
public class UserMfa : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public MfaType Type { get; set; }
    public bool IsEnabled { get; set; } = false;
    
    // TOTP
    public string? TotpSecret { get; set; }      // Encrypted
    public DateTime? TotpVerifiedAt { get; set; }
    
    // Recovery codes (JSON array, encrypted)
    public string? RecoveryCodes { get; set; }
    public int RecoveryCodesUsed { get; set; } = 0;
}

public enum MfaType
{
    Totp,           // Authenticator app
    Sms,            // SMS codes (future)
    Email           // Email codes (future)
}
```

### DataExportRequest.cs

```csharp
namespace Tymblok.Core.Entities;

/// <summary>
/// Tracks GDPR data export requests.
/// </summary>
public class DataExportRequest : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public ExportStatus Status { get; set; } = ExportStatus.Pending;
    public ExportFormat Format { get; set; } = ExportFormat.Json;
    
    public DateTime? ProcessedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }     // Download link expiry
    public string? DownloadUrl { get; set; }     // Signed URL
    public string? ErrorMessage { get; set; }
}

public enum ExportStatus
{
    Pending,
    Processing,
    Ready,
    Downloaded,
    Expired,
    Failed
}

public enum ExportFormat
{
    Json,
    Csv
}
```

---

## EF Core DbContext

```csharp
namespace Tymblok.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) 
        : base(options) { }
    
    public DbSet<User> Users => Set<User>();
    public DbSet<TimeBlock> TimeBlocks => Set<TimeBlock>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Integration> Integrations => Set<Integration>();
    public DbSet<InboxItem> InboxItems => Set<InboxItem>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<UserStats> UserStats => Set<UserStats>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Apply configurations
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(AppDbContext).Assembly);
        
        // Global query filter for soft deletes
        modelBuilder.Entity<User>()
            .HasQueryFilter(u => u.DeletedAt == null);
    }
    
    public override Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }
        
        return base.SaveChangesAsync(cancellationToken);
    }
}
```

---

## Entity Configurations

### UserConfiguration.cs

```csharp
namespace Tymblok.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        
        builder.HasKey(u => u.Id);
        
        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(255);
        
        builder.HasIndex(u => u.Email)
            .IsUnique();
        
        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(255);
        
        builder.Property(u => u.Name)
            .IsRequired()
            .HasMaxLength(100);
        
        builder.Property(u => u.AvatarUrl)
            .HasMaxLength(500);
        
        builder.Property(u => u.Theme)
            .HasConversion<string>()
            .HasMaxLength(20);
        
        builder.Property(u => u.TextSize)
            .HasConversion<string>()
            .HasMaxLength(20);
        
        // Relationships
        builder.HasMany(u => u.TimeBlocks)
            .WithOne(t => t.User)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        
        builder.HasMany(u => u.Categories)
            .WithOne(c => c.User)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        
        builder.HasMany(u => u.Integrations)
            .WithOne(i => i.User)
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        
        builder.HasMany(u => u.InboxItems)
            .WithOne(i => i.User)
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        
        builder.HasMany(u => u.RefreshTokens)
            .WithOne(r => r.User)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        
        builder.HasMany(u => u.Stats)
            .WithOne(s => s.User)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

### TimeBlockConfiguration.cs

```csharp
namespace Tymblok.Infrastructure.Data.Configurations;

public class TimeBlockConfiguration : IEntityTypeConfiguration<TimeBlock>
{
    public void Configure(EntityTypeBuilder<TimeBlock> builder)
    {
        builder.ToTable("time_blocks");
        
        builder.HasKey(t => t.Id);
        
        builder.Property(t => t.Title)
            .IsRequired()
            .HasMaxLength(200);
        
        builder.Property(t => t.Subtitle)
            .HasMaxLength(500);
        
        builder.Property(t => t.ExternalId)
            .HasMaxLength(100);
        
        builder.Property(t => t.ExternalUrl)
            .HasMaxLength(500);
        
        builder.Property(t => t.ExternalSource)
            .HasConversion<string>()
            .HasMaxLength(50);
        
        // Indexes
        builder.HasIndex(t => new { t.UserId, t.Date });
        builder.HasIndex(t => new { t.UserId, t.Date, t.SortOrder });
        builder.HasIndex(t => t.ExternalId);
        
        // Relationships
        builder.HasOne(t => t.Category)
            .WithMany(c => c.TimeBlocks)
            .HasForeignKey(t => t.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
```

### CategoryConfiguration.cs

```csharp
namespace Tymblok.Infrastructure.Data.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("categories");
        
        builder.HasKey(c => c.Id);
        
        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(50);
        
        builder.Property(c => c.Color)
            .IsRequired()
            .HasMaxLength(20);
        
        builder.Property(c => c.Icon)
            .IsRequired()
            .HasMaxLength(50);
        
        // Seed system categories
        builder.HasData(
            new Category
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Name = "GitHub",
                Color = "#10b981",
                Icon = "github",
                IsSystem = true
            },
            new Category
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                Name = "Jira",
                Color = "#3b82f6",
                Icon = "jira",
                IsSystem = true
            },
            new Category
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                Name = "Meeting",
                Color = "#a855f7",
                Icon = "users",
                IsSystem = true
            },
            new Category
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000004"),
                Name = "Focus",
                Color = "#f59e0b",
                Icon = "zap",
                IsSystem = true
            }
        );
    }
}
```

---

## Database Indexes

```sql
-- Performance indexes
CREATE INDEX idx_time_blocks_user_date ON time_blocks (user_id, date);
CREATE INDEX idx_time_blocks_user_date_sort ON time_blocks (user_id, date, sort_order);
CREATE INDEX idx_time_blocks_external_id ON time_blocks (external_id) WHERE external_id IS NOT NULL;

CREATE INDEX idx_inbox_items_user_dismissed ON inbox_items (user_id, is_dismissed);
CREATE INDEX idx_inbox_items_user_source ON inbox_items (user_id, source);

CREATE INDEX idx_integrations_user_provider ON integrations (user_id, provider);

CREATE INDEX idx_user_stats_user_date ON user_stats (user_id, date);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens (token);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
```

---

## Migrations

### Initial Migration Command

```bash
cd apps/api/src/Tymblok.Infrastructure

# Create migration
dotnet ef migrations add InitialCreate \
  --startup-project ../Tymblok.Api \
  --context AppDbContext

# Apply migration
dotnet ef database update \
  --startup-project ../Tymblok.Api \
  --context AppDbContext
```

---

## Seed Data Script

```csharp
namespace Tymblok.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // System categories are seeded via HasData in configuration
        
        // Add demo user for development
        if (!context.Users.Any())
        {
            var demoUser = new User
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Email = "demo@tymblok.dev",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo123!"),
                Name = "Demo User",
                EmailVerified = true,
                EmailVerifiedAt = DateTime.UtcNow
            };
            
            context.Users.Add(demoUser);
            
            // Add sample time blocks
            var today = DateOnly.FromDateTime(DateTime.Today);
            var githubCategory = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var jiraCategory = Guid.Parse("00000000-0000-0000-0000-000000000002");
            var meetingCategory = Guid.Parse("00000000-0000-0000-0000-000000000003");
            
            context.TimeBlocks.AddRange(
                new TimeBlock
                {
                    UserId = demoUser.Id,
                    CategoryId = githubCategory,
                    Title = "Review Pull Requests",
                    Subtitle = "Team PR queue",
                    Date = today,
                    StartTime = new TimeOnly(9, 0),
                    EndTime = new TimeOnly(10, 30),
                    DurationMinutes = 90,
                    SortOrder = 1
                },
                new TimeBlock
                {
                    UserId = demoUser.Id,
                    CategoryId = meetingCategory,
                    Title = "Team Standup",
                    Subtitle = "Daily sync",
                    Date = today,
                    StartTime = new TimeOnly(10, 30),
                    EndTime = new TimeOnly(11, 0),
                    DurationMinutes = 30,
                    SortOrder = 2
                },
                new TimeBlock
                {
                    UserId = demoUser.Id,
                    CategoryId = jiraCategory,
                    Title = "API Integration",
                    Subtitle = "JIRA-923",
                    Date = today,
                    StartTime = new TimeOnly(11, 0),
                    EndTime = new TimeOnly(13, 0),
                    DurationMinutes = 120,
                    IsUrgent = true,
                    SortOrder = 3
                }
            );
            
            await context.SaveChangesAsync();
        }
    }
}
```

---

## Connection String

```json
// appsettings.Development.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=tymblok_dev;Username=postgres;Password=postgres",
    "Redis": "localhost:6379"
  }
}

// appsettings.Production.json (use Azure Key Vault)
{
  "ConnectionStrings": {
    "DefaultConnection": "@Microsoft.KeyVault(SecretUri=https://tymblok-kv.vault.azure.net/secrets/db-connection)",
    "Redis": "@Microsoft.KeyVault(SecretUri=https://tymblok-kv.vault.azure.net/secrets/redis-connection)"
  }
}
```

---

*Last updated: January 2026*
