using CinemaBooking.Modules.Catalog.Application.MovieImports;
using CinemaBooking.Modules.Catalog.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CinemaBooking.Api.MovieImports;

public sealed class MovieImportScheduler : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IOptions<MovieImportOptions> _options;
    private readonly ILogger<MovieImportScheduler> _logger;

    public MovieImportScheduler(
        IServiceScopeFactory scopeFactory,
        IOptions<MovieImportOptions> options,
        ILogger<MovieImportScheduler> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunIfDueAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(
                    ex,
                    "Error while checking monthly movie import schedule.");
            }

            await Task.Delay(
                TimeSpan.FromMinutes(10),
                stoppingToken);
        }
    }

    private async Task RunIfDueAsync(CancellationToken cancellationToken)
    {
        var options = _options.Value;

        if (!options.Enabled)
        {
            return;
        }

        var now = DateTime.UtcNow;

        if (now.Day != Math.Clamp(options.RunOnDay, 1, 28) ||
            now.Hour < Math.Clamp(options.RunAtHour, 0, 23))
        {
            return;
        }

        using var scope = _scopeFactory.CreateScope();
        var dbContext =
            scope.ServiceProvider.GetRequiredService<CatalogDbContext>();

        var alreadyRanThisMonth =
            await dbContext.MovieImportBatches.AnyAsync(
                batch =>
                    batch.Source == MoveekMovieImportProvider.ProviderSource &&
                    batch.StartedAt.Year == now.Year &&
                    batch.StartedAt.Month == now.Month,
                cancellationToken);

        if (alreadyRanThisMonth)
        {
            return;
        }

        var importService =
            scope.ServiceProvider.GetRequiredService<MovieImportService>();

        _logger.LogInformation(
            "Starting scheduled movie import for {Source}.",
            MoveekMovieImportProvider.ProviderSource);

        await importService.RunAsync(
            new MovieImportRunRequest
            {
                Source = MoveekMovieImportProvider.ProviderSource
            },
            cancellationToken);
    }
}
