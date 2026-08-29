using CinemaBooking.Modules.Booking.Application;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CinemaBooking.Modules.Booking.Infrastructure.BackgroundJobs;

public class BookingExpirationWorker : BackgroundService
{
    private static readonly TimeSpan Interval =
        TimeSpan.FromMinutes(2.5);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BookingExpirationWorker> _logger;

    public BookingExpirationWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<BookingExpirationWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();

                var service =
                    scope.ServiceProvider
                        .GetRequiredService<BookingExpirationService>();

                await service.ExpireBookingsAsync();
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to expire bookings.");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }
}
