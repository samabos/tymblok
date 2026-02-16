using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Tymblok.Core.Entities;
using Tymblok.Core.Interfaces;
using Tymblok.Infrastructure.Data;
using Tymblok.Infrastructure.Email;
using Tymblok.Infrastructure.Repositories;
using Tymblok.Infrastructure.Services;

namespace Tymblok.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        bool useInMemoryDatabase = false,
        string? inMemoryDatabaseName = null)
    {
        // Database
        if (useInMemoryDatabase)
        {
            services.AddDbContext<TymblokDbContext>(options =>
                options.UseInMemoryDatabase(inMemoryDatabaseName ?? "TymblokTestDb"));
        }
        else
        {
            services.AddDbContext<TymblokDbContext>(options =>
                options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));
        }

        // ASP.NET Core Identity
        services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
        {
            // Password requirements
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequiredLength = 8;
            options.Password.RequiredUniqueChars = 4;

            // Lockout settings
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.AllowedForNewUsers = true;

            // User settings
            options.User.RequireUniqueEmail = true;
            options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";

            // SignIn settings
            options.SignIn.RequireConfirmedEmail = false; // Can enable later
            options.SignIn.RequireConfirmedAccount = false;

            // Token settings
            options.Tokens.EmailConfirmationTokenProvider = TokenOptions.DefaultEmailProvider;
            options.Tokens.PasswordResetTokenProvider = TokenOptions.DefaultEmailProvider;
        })
        .AddEntityFrameworkStores<TymblokDbContext>()
        .AddDefaultTokenProviders();

        // Configure token lifespan
        services.Configure<DataProtectionTokenProviderOptions>(options =>
        {
            options.TokenLifespan = TimeSpan.FromHours(24); // Email verification valid for 24 hours
        });

        // JWT Settings
        services.Configure<JwtSettings>(configuration.GetSection("Jwt"));

        // Auth Service Settings
        services.Configure<AuthServiceSettings>(options =>
        {
            options.RefreshTokenExpiryDays = configuration.GetValue<int>("Jwt:RefreshTokenExpiryDays", 7);
            options.AppBaseUrl = configuration.GetValue<string>("Email:AppBaseUrl") ?? "http://localhost:8081";
        });

        // Email Settings
        services.Configure<EmailSettings>(configuration.GetSection("Email"));

        // Repositories
        services.AddScoped<IAuthRepository, AuthRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IInboxRepository, InboxRepository>();
        services.AddScoped<IBlockRepository, BlockRepository>();

        // Services
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IAuditService, AuditService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IInboxService, InboxService>();
        services.AddScoped<IBlockService, BlockService>();

        return services;
    }
}
