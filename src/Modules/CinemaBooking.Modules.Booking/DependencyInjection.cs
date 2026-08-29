using CinemaBooking.Modules.Booking.Application.Bookings;
using CinemaBooking.Modules.Booking.Application.Interfaces;
using CinemaBooking.Modules.Booking.Application.SeatAvailability;
using CinemaBooking.Modules.Booking.Application.SeatHolds;
using CinemaBooking.Modules.Booking.Application;
using CinemaBooking.Modules.Booking.Contracts;
using CinemaBooking.Modules.Booking.Infrastructure.BackgroundJobs;
using CinemaBooking.Modules.Booking.Infrastructure.Persistence;
using CinemaBooking.Modules.Booking.Infrastructure.Redis;
using CinemaBooking.Modules.Booking.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace CinemaBooking.Modules.Booking;

public static class DependencyInjection
{
    public static IServiceCollection AddBookingModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString("Database");

        services.AddDbContext<BookingDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddScoped<IBookingRepository, BookingRepository>();
        services.AddScoped<IBookingModule, BookingModule>();
        services.AddScoped<ISeatHoldService, RedisSeatHoldService>();
        services.AddScoped<BookingService>();
        services.AddScoped<BookingExpirationService>();
        services.AddScoped<SeatHoldService>();
        services.AddScoped<SeatAvailabilityService>();
        services.AddHostedService<BookingExpirationWorker>();

        services.AddSingleton<IConnectionMultiplexer>(_ =>
        {
            var redisConnectionString =
                configuration.GetConnectionString("Redis") ??
                configuration["Redis:ConnectionString"] ??
                Environment.GetEnvironmentVariable("REDIS_URL")
                ?? throw new InvalidOperationException(
                    "Redis connection string is missing.");

            return RedisConnectionFactory.Connect(redisConnectionString);
        });

        return services;
    }
}
