namespace Tymblok.Core.Entities;

/// <summary>
/// Represents a coding session captured by an IDE extension (VS Code, JetBrains, etc.).
/// Contains aggregate stats only — no file paths, code content, or project names (GDPR).
/// </summary>
public class CodingSession : BaseEntity
{
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    /// <summary>Optional link to the time block the user was working on.</summary>
    public Guid? BlockId { get; set; }
    public TimeBlock? Block { get; set; }

    public DateTime StartedAt { get; set; }
    public DateTime EndedAt { get; set; }

    /// <summary>Active coding seconds (idle time excluded).</summary>
    public int ActiveSeconds { get; set; }

    /// <summary>Number of unique files edited (NOT file names).</summary>
    public int FilesEdited { get; set; }

    public int LinesAdded { get; set; }
    public int LinesRemoved { get; set; }

    /// <summary>JSON object: language → active seconds (e.g. {"typescript": 1200}).</summary>
    public string? Languages { get; set; }

    public int Commits { get; set; }

    /// <summary>Which IDE sent this session ("vscode", "jetbrains", etc.).</summary>
    public string Source { get; set; } = "vscode";
}
