using CinemaBooking.Modules.Theater.Application;
using CinemaBooking.Modules.Theater.Application.Interfaces;
using CinemaBooking.Modules.Theater.Contracts;
using CinemaBooking.Modules.Theater.Infrastructure.Persistence;
using CinemaBooking.Modules.Theater.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CinemaBooking.Modules.Theater;

public static class DependencyInjection
{
    public static IServiceCollection AddTheaterModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString("Database");

        services.AddDbContext<TheaterDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddScoped<ITheaterRepository, TheaterRepository>();
        services.AddScoped<TheaterService>();
        services.AddScoped<ITheaterModule, TheaterModule>();

        return services;
    }
}
