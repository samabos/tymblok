using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Tymblok.Core.Entities;

namespace Tymblok.Infrastructure.Data;

/// <summary>
/// Seeds initial data into the database including roles and system categories
/// </summary>
public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
        var dbContext = scope.ServiceProvider.GetRequiredService<TymblokDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<TymblokDbContext>>();

        await SeedRolesAsync(roleManager, logger);
        await SeedSystemCategoriesAsync(dbContext, logger);
    }

    private static async Task SeedSystemCategoriesAsync(TymblokDbContext dbContext, ILogger logger)
    {
        var systemCategories = new[]
        {
            new { Name = "Focus", Color = "#6366f1", Icon = "focus" },
            new { Name = "Meeting", Color = "#f59e0b", Icon = "meeting" },
            new { Name = "Break", Color = "#10b981", Icon = "break" },
            new { Name = "Code Review", Color = "#8b5cf6", Icon = "code-review" },
        };

        foreach (var cat in systemCategories)
        {
            var exists = await dbContext.Categories.AnyAsync(c => c.IsSystem && c.Name == cat.Name);
            if (!exists)
            {
                dbContext.Categories.Add(new Category
                {
                    Name = cat.Name,
                    Color = cat.Color,
                    Icon = cat.Icon,
                    IsSystem = true,
                    UserId = null,
                });
                logger.LogInformation("Seeded system category: {CategoryName}", cat.Name);
            }
        }

        await dbContext.SaveChangesAsync();
    }

    private static async Task SeedRolesAsync(RoleManager<ApplicationRole> roleManager, ILogger logger)
    {
        var roles = new[]
        {
            new ApplicationRole(RoleNames.ServiceUser, "Default user role with standard access"),
            new ApplicationRole(RoleNames.Administrator, "Administrator role with full access")
        };

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role.Name!))
            {
                var result = await roleManager.CreateAsync(role);
                if (result.Succeeded)
                {
                    logger.LogInformation("Created role: {RoleName}", role.Name);
                }
                else
                {
                    logger.LogError("Failed to create role {RoleName}: {Errors}",
                        role.Name, string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }
        }
    }
}
