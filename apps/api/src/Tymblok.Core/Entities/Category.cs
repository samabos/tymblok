namespace Tymblok.Core.Entities;

public class Category : BaseEntity
{
    public Guid? UserId { get; set; } // Null for system categories
    public ApplicationUser? User { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#6366f1"; // Hex color
    public string Icon { get; set; } = "default"; // Icon identifier

    public bool IsSystem { get; set; } = false; // System categories can't be deleted

    // Navigation
    public ICollection<TimeBlock> TimeBlocks { get; set; } = [];
}
