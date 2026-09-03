using CinemaBooking.Modules.Payment.Application.Interfaces;
using CinemaBooking.Modules.Payment.Application.PayOS;
using CinemaBooking.Modules.Payment.Application.Payments;
using CinemaBooking.Modules.Payment.Infrastructure.BackgroundJobs;
using CinemaBooking.Modules.Payment.Infrastructure.Persistence;
using CinemaBooking.Modules.Payment.Infrastructure.PayOS;
using CinemaBooking.Modules.Payment.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CinemaBooking.Modules.Payment;

public static class DependencyInjection
{
    public static IServiceCollection AddPaymentModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString("Database");

        services.AddDbContext<PaymentDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.Configure<PayOSPaymentOptions>(
            configuration.GetSection(PayOSPaymentOptions.SectionName));

        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<IPaymentGateway, PayOSPaymentGateway>();
        services.AddScoped<IPaymentWebhookService, PaymentWebhookService>();
        services.AddScoped<PaymentService>();
        services.AddHostedService<PaymentOutboxWorker>();

        return services;
    }
}
