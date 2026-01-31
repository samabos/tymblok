using Tymblok.Api.Extensions;
using Tymblok.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Configure services
builder.Services
    .AddApiServices(builder.Configuration)
    .AddInfrastructure(builder.Configuration);

var app = builder.Build();

// Configure middleware pipeline
app.ConfigurePipeline();

app.Run();
