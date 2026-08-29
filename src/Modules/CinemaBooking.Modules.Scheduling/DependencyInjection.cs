using CinemaBooking.Modules.Scheduling.Application;
using CinemaBooking.Modules.Scheduling.Application.Interfaces;
using CinemaBooking.Modules.Scheduling.Application.Showtimes;
using CinemaBooking.Modules.Scheduling.Contracts;
using CinemaBooking.Modules.Scheduling.Infrastructure.Persistence;
using CinemaBooking.Modules.Scheduling.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CinemaBooking.Modules.Scheduling;

public static class DependencyInjection
{
    public static IServiceCollection AddSchedulingModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString("Database");

        services.AddDbContext<SchedulingDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddScoped<IShowtimeRepository, ShowtimeRepository>();
        services.AddScoped<ShowtimeService>();
        services.AddScoped<ISchedulingModule, SchedulingModule>();

        return services;
    }
}
