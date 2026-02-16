using AspNet.Security.OAuth.GitHub;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Text.Json.Serialization;

namespace Tymblok.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApiServices(
        this IServiceCollection services,
        IConfiguration configuration,
        bool skipDatabaseHealthCheck = false)
    {
        // Controllers & Swagger
        services.AddControllers()
            .AddJsonOptions(options =>
            {
                // Convert enums to strings for JSON serialization
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Tymblok API",
                Version = "v1",
                Description = "Developer-aware time blocking API"
            });

            // JWT Authentication in Swagger
            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Enter your JWT token"
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        // CORS
        services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", policy =>
            {
                policy.AllowAnyOrigin()
                      .AllowAnyMethod()
                      .AllowAnyHeader();
            });
        });

        // Health Checks
        var healthChecks = services.AddHealthChecks();
        if (!skipDatabaseHealthCheck)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            if (!string.IsNullOrEmpty(connectionString))
            {
                healthChecks.AddNpgSql(connectionString, name: "postgresql");
            }
        }

        // JWT Authentication
        var jwtSettings = configuration.GetSection("Jwt");
        var secretKey = jwtSettings["Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");

        // OAuth settings
        var oauthSettings = configuration.GetSection("OAuth");
        var googleSettings = oauthSettings.GetSection("Google");
        var githubSettings = oauthSettings.GetSection("GitHub");

        var authBuilder = services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidAudience = jwtSettings["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
                };

                // Log JWT authentication failures for debugging
                options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
                {
                    OnAuthenticationFailed = context =>
                    {
                        var logger = context.HttpContext.RequestServices.GetRequiredService<ILoggerFactory>()
                            .CreateLogger("JwtAuthentication");
                        logger.LogWarning("JWT authentication failed: {Error}", context.Exception.Message);
                        return Task.CompletedTask;
                    }
                };
            })
            // Cookie scheme for OAuth intermediate state (not used for API auth)
            .AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options =>
            {
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            });

        // Add Google OAuth if configured
        var googleClientId = googleSettings["ClientId"];
        var googleClientSecret = googleSettings["ClientSecret"];
        if (!string.IsNullOrEmpty(googleClientId) && !string.IsNullOrEmpty(googleClientSecret))
        {
            authBuilder.AddGoogle(GoogleDefaults.AuthenticationScheme, options =>
            {
                options.ClientId = googleClientId;
                options.ClientSecret = googleClientSecret;
                options.Scope.Add("email");
                options.Scope.Add("profile");
                options.SaveTokens = true;
                options.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            });
        }

        // Add GitHub OAuth if configured
        var githubClientId = githubSettings["ClientId"];
        var githubClientSecret = githubSettings["ClientSecret"];
        if (!string.IsNullOrEmpty(githubClientId) && !string.IsNullOrEmpty(githubClientSecret))
        {
            authBuilder.AddGitHub(GitHubAuthenticationDefaults.AuthenticationScheme, options =>
            {
                options.ClientId = githubClientId;
                options.ClientSecret = githubClientSecret;
                options.Scope.Add("user:email");
                options.SaveTokens = true;
                options.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            });
        }

        services.AddAuthorization();

        return services;
    }
}
