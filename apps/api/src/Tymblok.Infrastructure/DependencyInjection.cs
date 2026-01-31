using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Tymblok.Core.Interfaces;
using Tymblok.Core.Services;
using Tymblok.Infrastructure.Data;
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

        // JWT Settings
        services.Configure<JwtSettings>(configuration.GetSection("Jwt"));

        // Repositories
        services.AddScoped<IAuthRepository, AuthRepository>();

        // Services
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IAuditService, AuditService>();
        services.AddScoped<IAuthService>(sp =>
        {
            var repository = sp.GetRequiredService<IAuthRepository>();
            var passwordHasher = sp.GetRequiredService<IPasswordHasher>();
            var tokenService = sp.GetRequiredService<ITokenService>();
            var auditService = sp.GetRequiredService<IAuditService>();
            var refreshTokenExpiryDays = configuration.GetValue<int>("Jwt:RefreshTokenExpiryDays", 7);
            return new AuthService(repository, passwordHasher, tokenService, auditService, refreshTokenExpiryDays);
        });

        return services;
    }
}
