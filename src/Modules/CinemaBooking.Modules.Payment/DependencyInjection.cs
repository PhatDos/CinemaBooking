using CinemaBooking.Modules.Payment.Application.Interfaces;
using CinemaBooking.Modules.Payment.Application.Payments;
using CinemaBooking.Modules.Payment.Infrastructure.Persistence;
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

        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<PaymentService>();

        return services;
    }
}
