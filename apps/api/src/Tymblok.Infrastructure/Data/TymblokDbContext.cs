using Microsoft.EntityFrameworkCore;
using Tymblok.Core.Entities;

namespace Tymblok.Infrastructure.Data;

public class TymblokDbContext : DbContext
{
    public TymblokDbContext(DbContextOptions<TymblokDbContext> options) : base(options) { }

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
        ConfigureUser(modelBuilder);
        ConfigureTimeBlock(modelBuilder);
        ConfigureCategory(modelBuilder);
        ConfigureIntegration(modelBuilder);
        ConfigureInboxItem(modelBuilder);
        ConfigureRefreshToken(modelBuilder);
        ConfigureUserStats(modelBuilder);

        // Global query filter for soft deletes
        modelBuilder.Entity<User>()
            .HasQueryFilter(u => u.DeletedAt == null);
    }

    private static void ConfigureUser(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(255);

            entity.HasIndex(e => e.Email).IsUnique();

            entity.Property(e => e.PasswordHash)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.AvatarUrl)
                .HasMaxLength(500);

            entity.Property(e => e.Theme)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(e => e.TextSize)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(e => e.Timezone)
                .HasMaxLength(50);

            // Relationships
            entity.HasMany(u => u.TimeBlocks)
                .WithOne(t => t.User)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(u => u.Categories)
                .WithOne(c => c.User)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(u => u.Integrations)
                .WithOne(i => i.User)
                .HasForeignKey(i => i.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(u => u.InboxItems)
                .WithOne(i => i.User)
                .HasForeignKey(i => i.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(u => u.RefreshTokens)
                .WithOne(r => r.User)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(u => u.Stats)
                .WithOne(s => s.User)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureTimeBlock(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TimeBlock>(entity =>
        {
            entity.ToTable("time_blocks");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Title)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Subtitle)
                .HasMaxLength(500);

            entity.Property(e => e.ExternalId)
                .HasMaxLength(100);

            entity.Property(e => e.ExternalUrl)
                .HasMaxLength(500);

            entity.Property(e => e.ExternalSource)
                .HasConversion<string>()
                .HasMaxLength(50);

            // Indexes
            entity.HasIndex(e => new { e.UserId, e.Date });
            entity.HasIndex(e => new { e.UserId, e.Date, e.SortOrder });
            entity.HasIndex(e => e.ExternalId);

            // Relationships
            entity.HasOne(t => t.Category)
                .WithMany(c => c.TimeBlocks)
                .HasForeignKey(t => t.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureCategory(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("categories");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.Color)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(e => e.Icon)
                .IsRequired()
                .HasMaxLength(50);

            // Seed system categories
            entity.HasData(
                new Category
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    Name = "GitHub",
                    Color = "#10b981",
                    Icon = "github",
                    IsSystem = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Category
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    Name = "Jira",
                    Color = "#3b82f6",
                    Icon = "jira",
                    IsSystem = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Category
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                    Name = "Meeting",
                    Color = "#a855f7",
                    Icon = "users",
                    IsSystem = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Category
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000004"),
                    Name = "Focus",
                    Color = "#f59e0b",
                    Icon = "zap",
                    IsSystem = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );
        });
    }

    private static void ConfigureIntegration(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Integration>(entity =>
        {
            entity.ToTable("integrations");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => new { e.UserId, e.Provider }).IsUnique();

            entity.Property(e => e.Provider)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.Property(e => e.AccessToken)
                .IsRequired()
                .HasMaxLength(2000);

            entity.Property(e => e.RefreshToken)
                .HasMaxLength(2000);

            entity.Property(e => e.ExternalUserId)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.ExternalUsername)
                .HasMaxLength(100);

            entity.Property(e => e.ExternalAvatarUrl)
                .HasMaxLength(500);

            entity.Property(e => e.LastSyncError)
                .HasMaxLength(1000);

            // Relationships
            entity.HasMany(i => i.InboxItems)
                .WithOne(item => item.Integration)
                .HasForeignKey(item => item.IntegrationId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }

    private static void ConfigureInboxItem(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<InboxItem>(entity =>
        {
            entity.ToTable("inbox_items");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Title)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Description)
                .HasMaxLength(2000);

            entity.Property(e => e.Source)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.Property(e => e.Type)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.Property(e => e.Priority)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(e => e.ExternalId)
                .HasMaxLength(100);

            entity.Property(e => e.ExternalUrl)
                .HasMaxLength(500);

            // Indexes
            entity.HasIndex(e => new { e.UserId, e.IsDismissed });
            entity.HasIndex(e => new { e.UserId, e.Source });
        });
    }

    private static void ConfigureRefreshToken(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("refresh_tokens");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Token)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.ReplacedByToken)
                .HasMaxLength(500);

            entity.Property(e => e.CreatedByIp)
                .HasMaxLength(50);

            entity.Property(e => e.RevokedByIp)
                .HasMaxLength(50);

            // Indexes
            entity.HasIndex(e => e.Token);
            entity.HasIndex(e => e.UserId);

            // Ignore computed properties
            entity.Ignore(e => e.IsExpired);
            entity.Ignore(e => e.IsRevoked);
            entity.Ignore(e => e.IsActive);
        });
    }

    private static void ConfigureUserStats(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserStats>(entity =>
        {
            entity.ToTable("user_stats");
            entity.HasKey(e => e.Id);

            // Indexes
            entity.HasIndex(e => new { e.UserId, e.Date });
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
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
