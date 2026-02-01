using Microsoft.AspNetCore.Identity;

namespace Tymblok.Core.Entities;

/// <summary>
/// Application role extending ASP.NET Core Identity.
/// Predefined roles: service-user (default), administrator
/// </summary>
public class ApplicationRole : IdentityRole<Guid>
{
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ApplicationRole() : base()
    {
        Id = Guid.NewGuid();
    }

    public ApplicationRole(string roleName) : base(roleName)
    {
        Id = Guid.NewGuid();
    }

    public ApplicationRole(string roleName, string description) : base(roleName)
    {
        Id = Guid.NewGuid();
        Description = description;
    }
}

/// <summary>
/// Constants for role names to avoid magic strings
/// </summary>
public static class RoleNames
{
    public const string ServiceUser = "service-user";
    public const string Administrator = "administrator";
}
