using CinemaBooking.Modules.Booking.Infrastructure.Persistence;
using CinemaBooking.Modules.Catalog.Infrastructure.Persistence;
using CinemaBooking.Modules.Identity.Infrastructure.Persistence;
using CinemaBooking.Modules.Payment.Infrastructure.Persistence;
using CinemaBooking.Modules.Scheduling.Infrastructure.Persistence;
using CinemaBooking.Modules.Theater.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.Api.Database;

public static class DatabaseMigrationExtensions
{
    public static async Task ApplyMigrationsAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();

        var catalog =
            scope.ServiceProvider.GetRequiredService<CatalogDbContext>();

        var theater =
            scope.ServiceProvider.GetRequiredService<TheaterDbContext>();

        var scheduling =
            scope.ServiceProvider.GetRequiredService<SchedulingDbContext>();

        var booking =
            scope.ServiceProvider.GetRequiredService<BookingDbContext>();

        var identity =
            scope.ServiceProvider.GetRequiredService<IdentityDbContext>();

        var payment =
            scope.ServiceProvider.GetRequiredService<PaymentDbContext>();

        await catalog.Database.MigrateAsync();
        await theater.Database.MigrateAsync();
        await scheduling.Database.MigrateAsync();
        await booking.Database.MigrateAsync();
        await identity.Database.MigrateAsync();
        await payment.Database.MigrateAsync();
    }
}
