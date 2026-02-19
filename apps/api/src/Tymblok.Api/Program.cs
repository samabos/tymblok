using Microsoft.EntityFrameworkCore;
using Serilog;
using Tymblok.Api.Extensions;
using Tymblok.Infrastructure;
using Tymblok.Infrastructure.Data;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.Hosting.Lifetime", Serilog.Events.LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

try
{
    Log.Information("Starting Tymblok API");

    var builder = WebApplication.CreateBuilder(args);

    // Use Serilog
    builder.Host.UseSerilog();

    // Check if running in test environment
    var isTestEnvironment = builder.Environment.IsEnvironment("Testing");

    // Configure services
    builder.Services
        .AddApiServices(builder.Configuration, skipDatabaseHealthCheck: isTestEnvironment)
        .AddInfrastructure(builder.Configuration, useInMemoryDatabase: isTestEnvironment);

    var app = builder.Build();

    // Apply migrations and seed data on startup
    if (!isTestEnvironment)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TymblokDbContext>();

        Log.Information("Applying database migrations...");
        db.Database.Migrate();
        Log.Information("Database migrations applied successfully");

        // Seed initial data (roles, etc.)
        Log.Information("Seeding initial data...");
        await DataSeeder.SeedAsync(app.Services);
        Log.Information("Data seeding completed");
    }

    // Configure middleware pipeline
    app.ConfigurePipeline();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
