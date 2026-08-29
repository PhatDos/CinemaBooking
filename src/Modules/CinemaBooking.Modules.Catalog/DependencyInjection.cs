using CinemaBooking.Modules.Catalog.Application;
using CinemaBooking.Modules.Catalog.Application.Interfaces;
using CinemaBooking.Modules.Catalog.Application.Movies;
using CinemaBooking.Modules.Catalog.Contracts;
using CinemaBooking.Modules.Catalog.Infrastructure.Persistence;
using CinemaBooking.Modules.Catalog.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CinemaBooking.Modules.Catalog;

public static class DependencyInjection
{
    public static IServiceCollection AddCatalogModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString("Database");

        services.AddDbContext<CatalogDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddScoped<IMovieRepository, MovieRepository>();
        services.AddScoped<MovieService>();
        services.AddScoped<ICatalogModule, CatalogModule>();

        return services;
    }
}
