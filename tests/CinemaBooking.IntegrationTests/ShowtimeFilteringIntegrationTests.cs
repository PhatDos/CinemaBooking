using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using CinemaBooking.Api.Controllers;
using CinemaBooking.Modules.Catalog.Domain;
using CinemaBooking.Modules.Catalog.Infrastructure.Persistence;
using CinemaBooking.Modules.Scheduling.Contracts;
using CinemaBooking.Modules.Scheduling.Domain;
using CinemaBooking.Modules.Scheduling.Infrastructure.Persistence;
using CinemaBooking.Modules.Theater.Domain;
using CinemaBooking.Modules.Theater.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;

namespace CinemaBooking.IntegrationTests;

public class ShowtimeFilteringIntegrationTests
{
    private const string RedisUnavailable =
        "localhost:6390,connectTimeout=100,connectRetry=0";

    [Fact]
    public async Task Movie_showtimes_ignore_include_past_for_public_user()
    {
        using var factory = new RedisCacheApiFactory(RedisUnavailable);
        var client = factory.CreateClient();
        var seed = await SeedShowtimeDataAsync(factory);

        var response = await client.GetAsync(
            BuildQuery(
                $"/api/movies/{seed.MovieId}/showtimes",
                seed.PastStart.AddHours(-1),
                seed.FutureStart.AddHours(1),
                includePast: true));
        var showtimes =
            await response.Content.ReadFromJsonAsync<List<ShowtimeInfo>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.DoesNotContain(
            showtimes ?? [],
            showtime => showtime.Id == seed.PastShowtimeId);
        Assert.Contains(
            showtimes ?? [],
            showtime => showtime.Id == seed.FutureShowtimeId);
    }

    [Fact]
    public async Task Movie_showtimes_allow_admin_to_filter_past_range()
    {
        using var factory = new RedisCacheApiFactory(RedisUnavailable);
        var client = factory.CreateClient();
        RedisCacheApiFactory.AuthorizeAsAdmin(client);
        var seed = await SeedShowtimeDataAsync(factory);

        var response = await client.GetAsync(
            BuildQuery(
                $"/api/movies/{seed.MovieId}/showtimes",
                seed.PastStart.AddHours(-1),
                seed.FutureStart.AddHours(1),
                includePast: true));
        var showtimes =
            await response.Content.ReadFromJsonAsync<List<ShowtimeInfo>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains(
            showtimes ?? [],
            showtime => showtime.Id == seed.PastShowtimeId);
        Assert.Contains(
            showtimes ?? [],
            showtime => showtime.Id == seed.FutureShowtimeId);
    }

    [Fact]
    public async Task Cinema_showtimes_allow_staff_to_filter_past_range()
    {
        using var factory = new RedisCacheApiFactory(RedisUnavailable);
        var client = factory.CreateClient();
        RedisCacheApiFactory.AuthorizeAsStaff(client);
        var seed = await SeedShowtimeDataAsync(factory);

        var response = await client.GetAsync(
            BuildQuery(
                $"/api/cinemas/{seed.CinemaId}/showtimes",
                seed.PastStart.AddHours(-1),
                seed.PastStart.AddHours(1),
                includePast: true));
        var showtimes =
            await response.Content.ReadFromJsonAsync<List<CinemaShowtimeResponse>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var showtime = Assert.Single(showtimes ?? []);
        Assert.Equal(seed.PastShowtimeId, showtime.ShowtimeId);
    }

    [Fact]
    public async Task Showtime_filters_reject_invalid_range()
    {
        using var factory = new RedisCacheApiFactory(RedisUnavailable);
        var client = factory.CreateClient();
        var seed = await SeedShowtimeDataAsync(factory);

        var response = await client.GetAsync(
            BuildQuery(
                $"/api/movies/{seed.MovieId}/showtimes",
                seed.FutureStart,
                seed.PastStart,
                includePast: true));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private static async Task<ShowtimeSeed> SeedShowtimeDataAsync(
        RedisCacheApiFactory factory)
    {
        var movieId = Guid.NewGuid();
        var cinemaId = Guid.NewGuid();
        var roomId = Guid.NewGuid();
        var pastShowtimeId = Guid.NewGuid();
        var futureShowtimeId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        var pastStart = now.AddDays(-2);
        var futureStart = now.AddHours(2);

        await factory.ExecuteScopeAsync(async services =>
        {
            var catalog = services.GetRequiredService<CatalogDbContext>();
            var theater = services.GetRequiredService<TheaterDbContext>();
            var scheduling = services.GetRequiredService<SchedulingDbContext>();

            catalog.Movies.Add(new Movie
            {
                Id = movieId,
                Title = "Date Filter Movie",
                Description = "Movie for showtime date filters",
                DurationMinutes = 100,
                ReleaseDate = now.Date,
                IsActive = true
            });

            theater.Cinemas.Add(new Cinema
            {
                Id = cinemaId,
                Name = "Date Filter Cinema",
                Address = "1 Date Street",
                City = "Da Nang",
                IsActive = true
            });

            theater.Rooms.Add(new Room
            {
                Id = roomId,
                CinemaId = cinemaId,
                Name = "Room 1",
                IsActive = true
            });

            scheduling.Showtimes.AddRange(
                CreateShowtime(
                    pastShowtimeId,
                    movieId,
                    roomId,
                    pastStart),
                CreateShowtime(
                    futureShowtimeId,
                    movieId,
                    roomId,
                    futureStart));

            await catalog.SaveChangesAsync();
            await theater.SaveChangesAsync();
            await scheduling.SaveChangesAsync();
        });

        return new ShowtimeSeed(
            cinemaId,
            futureShowtimeId,
            futureStart,
            movieId,
            pastShowtimeId,
            pastStart);
    }

    private static Showtime CreateShowtime(
        Guid id,
        Guid movieId,
        Guid roomId,
        DateTime startTime)
    {
        return new Showtime
        {
            Id = id,
            MovieId = movieId,
            RoomId = roomId,
            StartTime = startTime,
            EndTime = startTime.AddMinutes(100),
            BasePrice = 90000m,
            StandardPrice = 90000m,
            VipPrice = 100000m,
            CouplePrice = 200000m
        };
    }

    private static string BuildQuery(
        string path,
        DateTime from,
        DateTime to,
        bool includePast)
    {
        var fromValue = Uri.EscapeDataString(
            from.ToString("O", CultureInfo.InvariantCulture));
        var toValue = Uri.EscapeDataString(
            to.ToString("O", CultureInfo.InvariantCulture));
        var includePastValue = includePast.ToString().ToLowerInvariant();

        return $"{path}?from={fromValue}&to={toValue}&includePast={includePastValue}";
    }

    private sealed record ShowtimeSeed(
        Guid CinemaId,
        Guid FutureShowtimeId,
        DateTime FutureStart,
        Guid MovieId,
        Guid PastShowtimeId,
        DateTime PastStart);
}
