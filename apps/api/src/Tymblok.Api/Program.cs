using Tymblok.Api.Extensions;
using Tymblok.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Check if running in test environment
var isTestEnvironment = builder.Environment.IsEnvironment("Testing");

// Configure services
builder.Services
    .AddApiServices(builder.Configuration, skipDatabaseHealthCheck: isTestEnvironment)
    .AddInfrastructure(builder.Configuration, useInMemoryDatabase: isTestEnvironment);

var app = builder.Build();

// Configure middleware pipeline
app.ConfigurePipeline();

app.Run();
