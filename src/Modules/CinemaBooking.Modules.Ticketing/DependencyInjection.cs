using CinemaBooking.Modules.Ticketing.Application;
using CinemaBooking.Modules.Ticketing.Application.Email;
using CinemaBooking.Modules.Ticketing.Contracts;
using CinemaBooking.Modules.Ticketing.Infrastructure.BackgroundJobs;
using CinemaBooking.Modules.Ticketing.Infrastructure.Email;
using CinemaBooking.Modules.Ticketing.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CinemaBooking.Modules.Ticketing;

public static class DependencyInjection
{
    public static IServiceCollection AddTicketingModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString("Database");

        services.AddDbContext<TicketingDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddScoped<ITicketingModule, TicketingModule>();
        services.AddScoped<IEmailSender, LoggingEmailSender>();
        services.AddScoped<ITicketQrCodeGenerator, QrCodeTicketQrCodeGenerator>();
        services.AddHostedService<TicketEmailWorker>();

        return services;
    }
}
