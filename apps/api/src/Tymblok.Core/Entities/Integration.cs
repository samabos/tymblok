namespace Tymblok.Core.Entities;

public class Integration : BaseEntity
{
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public IntegrationProvider Provider { get; set; }

    // User-facing label (e.g., "Work GitHub", "Personal Calendar")
    public string Name { get; set; } = string.Empty;

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
    public ICollection<InboxItem> InboxItems { get; set; } = [];
}
