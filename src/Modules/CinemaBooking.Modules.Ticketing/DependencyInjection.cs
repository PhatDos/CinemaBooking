using CinemaBooking.Modules.Ticketing.Application;
using CinemaBooking.Modules.Ticketing.Application.Email;
using CinemaBooking.Modules.Ticketing.Contracts;
using CinemaBooking.Modules.Ticketing.Infrastructure.BackgroundJobs;
using CinemaBooking.Modules.Ticketing.Infrastructure.Email;
using CinemaBooking.Modules.Ticketing.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

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

        services.Configure<SmtpEmailOptions>(
            configuration.GetSection(SmtpEmailOptions.SectionName));

        services.AddScoped<ITicketingModule, TicketingModule>();
        services.AddScoped<LoggingEmailSender>();
        services.AddScoped<SmtpEmailSender>();
        services.AddScoped<IEmailSender>(provider =>
        {
            var emailProvider =
                configuration["Email:Provider"];

            var smtpOptions =
                provider.GetRequiredService<IOptions<SmtpEmailOptions>>()
                    .Value;

            if (string.Equals(
                    emailProvider,
                    "Smtp",
                    StringComparison.OrdinalIgnoreCase) &&
                smtpOptions.IsConfigured())
            {
                return provider.GetRequiredService<SmtpEmailSender>();
            }

            return provider.GetRequiredService<LoggingEmailSender>();
        });
        services.AddScoped<ITicketQrCodeGenerator, QrCodeTicketQrCodeGenerator>();
        services.AddHostedService<TicketEmailWorker>();

        return services;
    }
}
