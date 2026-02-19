using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Tymblok.Core.Interfaces;

namespace Tymblok.Infrastructure.Services;

public class IntegrationSyncWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<IntegrationSyncWorker> _logger;
    private readonly int _syncIntervalMinutes;

    public IntegrationSyncWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<IntegrationSyncWorker> logger,
        IConfiguration configuration)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _syncIntervalMinutes = configuration.GetValue<int>("Integrations:SyncIntervalMinutes", 15);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Integration sync worker started. Interval: {Interval} minutes", _syncIntervalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromMinutes(_syncIntervalMinutes), stoppingToken);
                await SyncAllIntegrationsAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in integration sync worker");
            }
        }

        _logger.LogInformation("Integration sync worker stopped");
    }

    private async Task SyncAllIntegrationsAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IIntegrationRepository>();

        var integrations = await repository.GetAllWithActiveTokensAsync(ct);
        _logger.LogInformation("Starting background sync for {Count} integrations", integrations.Count);

        foreach (var integration in integrations)
        {
            if (ct.IsCancellationRequested) break;

            try
            {
                using var syncScope = _scopeFactory.CreateScope();
                var integrationService = syncScope.ServiceProvider.GetRequiredService<IIntegrationService>();
                await integrationService.SyncAsync(integration.UserId, integration.Provider, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Background sync failed | Provider: {Provider} | IntegrationId: {IntegrationId} | UserId: {UserId}",
                    integration.Provider, integration.Id, integration.UserId);
            }
        }
    }
}
