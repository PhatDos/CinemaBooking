using CinemaBooking.Modules.Catalog.Application;
using CinemaBooking.Modules.Catalog.Application.Genres;
using CinemaBooking.Modules.Catalog.Application.Interfaces;
using CinemaBooking.Modules.Catalog.Application.MovieImports;
using CinemaBooking.Modules.Catalog.Application.Movies;
using CinemaBooking.Modules.Catalog.Contracts;
using CinemaBooking.Modules.Catalog.Infrastructure.Persistence;
using CinemaBooking.Modules.Catalog.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

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

        services.AddMemoryCache();
        services.Configure<MovieImportOptions>(
            configuration.GetSection(MovieImportOptions.SectionName));
        services.AddScoped<IGenreRepository, GenreRepository>();
        services.AddScoped<IMovieRepository, MovieRepository>();
        services.AddScoped<GenreService>();
        services.AddScoped<MovieService>();
        services.TryAddScoped<IMoviePosterImporter, PassThroughMoviePosterImporter>();
        services.AddScoped<MovieImportService>();
        services.AddHttpClient<IMovieImportProvider, MoveekMovieImportProvider>(
            (serviceProvider, client) =>
            {
                var options =
                    serviceProvider
                        .GetRequiredService<
                            Microsoft.Extensions.Options.IOptions<MovieImportOptions>>()
                        .Value;

                client.BaseAddress = new Uri(
                    options.Moveek.BaseUrl.TrimEnd('/') + "/");
                client.Timeout = TimeSpan.FromSeconds(15);
                client.DefaultRequestHeaders.UserAgent.ParseAdd(
                    options.UserAgent);
            });
        services.AddScoped<ICatalogModule, CatalogModule>();

        return services;
    }
}
