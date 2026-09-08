using System.Net;
using System.Net.Http.Json;
using CinemaBooking.Modules.Catalog.Application.Genres;
using CinemaBooking.Modules.Catalog.Application.Movies;
using CinemaBooking.Modules.Catalog.Domain;
using CinemaBooking.Modules.Catalog.Infrastructure.Persistence;
using CinemaBooking.Modules.Scheduling.Application.Showtimes;
using CinemaBooking.Modules.Scheduling.Infrastructure.Persistence;
using CinemaBooking.Modules.Theater.Application.Cinemas;
using CinemaBooking.Modules.Theater.Application.Seats;
using CinemaBooking.Modules.Theater.Domain;
using CinemaBooking.Modules.Theater.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CinemaBooking.IntegrationTests;

public class RedisCacheIntegrationTests :
    IClassFixture<RedisContainerFixture>
{
    private readonly RedisContainerFixture _redis;

    public RedisCacheIntegrationTests(RedisContainerFixture redis)
    {
        _redis = redis;
    }

    [Fact]
    [Trait("Category", "RedisCache")]
    public async Task Movies_return_miss_then_hit_and_update_invalidates_cache()
    {
        using var factory = new RedisCacheApiFactory(_redis.ConnectionString);
        var client = factory.CreateClient();
        var movieId = Guid.NewGuid();

        await factory.ExecuteScopeAsync(async services =>
        {
            var dbContext = services.GetRequiredService<CatalogDbContext>();

            dbContext.Movies.Add(new Movie
            {
                Id = movieId,
                Title = "Cache Movie",
                Description = "Cached movie description",
                DurationMinutes = 100,
                ReleaseDate = DateTime.UtcNow.Date,
                IsActive = true
            });

            await dbContext.SaveChangesAsync();
        });

        var first = await client.GetAsync("/api/movies");
        var second = await client.GetAsync("/api/movies");

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal("MISS", GetCacheHeader(first));
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        Assert.Equal("HIT", GetCacheHeader(second));

        RedisCacheApiFactory.AuthorizeAsAdmin(client);
        var update = await client.PutAsJsonAsync(
            $"/api/movies/{movieId}",
            new UpdateMovieRequest
            {
                Title = "Cache Movie Updated",
                Description = "Cached movie description updated",
                DurationMinutes = 105,
                ReleaseDate = DateTime.UtcNow.Date,
                IsActive = true
            });

        Assert.Equal(HttpStatusCode.NoContent, update.StatusCode);

        client.DefaultRequestHeaders.Authorization = null;
        var afterUpdate = await client.GetAsync("/api/movies");
        var movies =
            await afterUpdate.Content.ReadFromJsonAsync<List<MovieResponse>>();

        Assert.Equal(HttpStatusCode.OK, afterUpdate.StatusCode);
        Assert.Equal("MISS", GetCacheHeader(afterUpdate));
        Assert.Contains(
            movies ?? [],
            movie => movie.Id == movieId && movie.Title == "Cache Movie Updated");
    }

    [Fact]
    [Trait("Category", "RedisCache")]
    public async Task Genres_return_miss_then_hit_and_create_invalidates_cache()
    {
        using var factory = new RedisCacheApiFactory(_redis.ConnectionString);
        var client = factory.CreateClient();

        await factory.ExecuteScopeAsync(async services =>
        {
            var dbContext = services.GetRequiredService<CatalogDbContext>();

            dbContext.Genres.Add(new Genre
            {
                Id = Guid.NewGuid(),
                Name = "Action",
                Slug = "action",
                ImageUrl = "https://cdn.example.test/genres/action.jpg",
                CreatedAt = DateTime.UtcNow
            });

            await dbContext.SaveChangesAsync();
        });

        var first = await client.GetAsync("/api/genres");
        var second = await client.GetAsync("/api/genres");

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal("MISS", GetCacheHeader(first));
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        Assert.Equal("HIT", GetCacheHeader(second));

        RedisCacheApiFactory.AuthorizeAsAdmin(client);
        var create = await client.PostAsJsonAsync(
            "/api/genres",
            new CreateGenreRequest
            {
                Name = "Drama",
                Slug = "drama",
                ImageUrl = "https://cdn.example.test/genres/drama.jpg"
            });

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);

        client.DefaultRequestHeaders.Authorization = null;
        var afterCreate = await client.GetAsync("/api/genres");
        var genres =
            await afterCreate.Content.ReadFromJsonAsync<List<GenreResponse>>();

        Assert.Equal(HttpStatusCode.OK, afterCreate.StatusCode);
        Assert.Equal("MISS", GetCacheHeader(afterCreate));
        Assert.Contains(
            genres ?? [],
            genre => genre.Slug == "drama");
    }

    [Fact]
    [Trait("Category", "RedisCache")]
    public async Task Cinemas_normalize_keys_and_update_invalidates_list_and_detail()
    {
        using var factory = new RedisCacheApiFactory(_redis.ConnectionString);
        var client = factory.CreateClient();
        var cinemaId = Guid.NewGuid();

        await factory.ExecuteScopeAsync(async services =>
        {
            var dbContext = services.GetRequiredService<TheaterDbContext>();

            dbContext.Cinemas.Add(new Cinema
            {
                Id = cinemaId,
                Name = "Da Nang Cache Cinema",
                Address = "1 Cache Street",
                City = "Da Nang",
                ProvinceCode = "DN",
                ProvinceName = "Da Nang",
                WardCode = "HC",
                WardName = "Hai Chau",
                AddressLine = "1 Cache Street",
                IsActive = true
            });

            await dbContext.SaveChangesAsync();
        });

        var firstList =
            await client.GetAsync("/api/cinemas?provinceCode=dn&wardCode=hc");
        var normalizedList =
            await client.GetAsync("/api/cinemas?provinceCode=%20DN%20&wardCode=%20HC%20");
        var firstDetail =
            await client.GetAsync($"/api/cinemas/{cinemaId}");
        var secondDetail =
            await client.GetAsync($"/api/cinemas/{cinemaId}");

        Assert.Equal("MISS", GetCacheHeader(firstList));
        Assert.Equal("HIT", GetCacheHeader(normalizedList));
        Assert.Equal("MISS", GetCacheHeader(firstDetail));
        Assert.Equal("HIT", GetCacheHeader(secondDetail));

        RedisCacheApiFactory.AuthorizeAsAdmin(client);
        var update = await client.PutAsJsonAsync(
            $"/api/cinemas/{cinemaId}",
            new UpdateCinemaRequest(
                "Da Nang Cache Cinema Updated",
                "2 Cache Street",
                "Da Nang",
                "Updated",
                null,
                true,
                "DN",
                "Da Nang",
                "HC",
                "Hai Chau",
                "2 Cache Street"));

        Assert.Equal(HttpStatusCode.NoContent, update.StatusCode);

        client.DefaultRequestHeaders.Authorization = null;
        var afterUpdateList =
            await client.GetAsync("/api/cinemas?provinceCode=DN&wardCode=HC");
        var afterUpdateDetail =
            await client.GetAsync($"/api/cinemas/{cinemaId}");
        var cinema =
            await afterUpdateDetail.Content.ReadFromJsonAsync<CinemaResponse>();

        Assert.Equal("MISS", GetCacheHeader(afterUpdateList));
        Assert.Equal("MISS", GetCacheHeader(afterUpdateDetail));
        Assert.Equal("Da Nang Cache Cinema Updated", cinema?.Name);
    }

    [Fact]
    [Trait("Category", "RedisCache")]
    public async Task Room_seat_layout_returns_miss_then_hit_and_create_seat_invalidates_cache()
    {
        using var factory = new RedisCacheApiFactory(_redis.ConnectionString);
        var client = factory.CreateClient();
        var cinemaId = Guid.NewGuid();
        var roomId = Guid.NewGuid();

        await factory.ExecuteScopeAsync(async services =>
        {
            var dbContext = services.GetRequiredService<TheaterDbContext>();

            dbContext.Cinemas.Add(new Cinema
            {
                Id = cinemaId,
                Name = "Seat Cache Cinema",
                Address = "1 Seat Street",
                City = "Ho Chi Minh City",
                IsActive = true
            });
            dbContext.Rooms.Add(new Room
            {
                Id = roomId,
                CinemaId = cinemaId,
                Name = "Room 1",
                IsActive = true
            });
            dbContext.Seats.Add(new Seat
            {
                Id = Guid.NewGuid(),
                RoomId = roomId,
                Row = "A",
                Number = 1,
                Type = SeatType.Standard
            });

            await dbContext.SaveChangesAsync();
        });

        var first = await client.GetAsync($"/api/rooms/{roomId}/seats");
        var second = await client.GetAsync($"/api/rooms/{roomId}/seats");

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal("MISS", GetCacheHeader(first));
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        Assert.Equal("HIT", GetCacheHeader(second));

        RedisCacheApiFactory.AuthorizeAsAdmin(client);
        var create = await client.PostAsJsonAsync(
            $"/api/rooms/{roomId}/seats",
            new CreateSeatRequest
            {
                Row = "A",
                Number = 2,
                Type = "VIP"
            });

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);

        client.DefaultRequestHeaders.Authorization = null;
        var afterCreate = await client.GetAsync($"/api/rooms/{roomId}/seats");
        var seats =
            await afterCreate.Content.ReadFromJsonAsync<List<SeatResponse>>();

        Assert.Equal(HttpStatusCode.OK, afterCreate.StatusCode);
        Assert.Equal("MISS", GetCacheHeader(afterCreate));
        Assert.Equal(2, seats?.Count);
    }

    [Fact]
    [Trait("Category", "RedisCache")]
    public async Task Now_showing_create_showtime_invalidates_cache()
    {
        using var factory = new RedisCacheApiFactory(_redis.ConnectionString);
        var client = factory.CreateClient();
        var movieId = Guid.NewGuid();
        var cinemaId = Guid.NewGuid();
        var roomId = Guid.NewGuid();

        await factory.ExecuteScopeAsync(async services =>
        {
            var catalog = services.GetRequiredService<CatalogDbContext>();
            var theater = services.GetRequiredService<TheaterDbContext>();

            catalog.Movies.Add(new Movie
            {
                Id = movieId,
                Title = "Now Showing Cache Movie",
                Description = "Now showing cache description",
                DurationMinutes = 90,
                ReleaseDate = DateTime.UtcNow.Date,
                IsActive = true
            });

            theater.Cinemas.Add(new Cinema
            {
                Id = cinemaId,
                Name = "Now Showing Cinema",
                Address = "1 Showtime Street",
                City = "Ha Noi",
                IsActive = true
            });
            theater.Rooms.Add(new Room
            {
                Id = roomId,
                CinemaId = cinemaId,
                Name = "Room 1",
                IsActive = true
            });

            await catalog.SaveChangesAsync();
            await theater.SaveChangesAsync();
        });

        var first = await client.GetAsync("/api/movies/now-showing");
        var second = await client.GetAsync("/api/movies/now-showing");

        Assert.Equal("MISS", GetCacheHeader(first));
        Assert.Equal("HIT", GetCacheHeader(second));

        RedisCacheApiFactory.AuthorizeAsAdmin(client);
        var createShowtime = await client.PostAsJsonAsync(
            "/api/showtimes",
            new CreateShowtimeRequest
            {
                MovieId = movieId,
                RoomId = roomId,
                StartTime = DateTime.UtcNow.AddDays(2),
                BasePrice = 90000m,
                StandardPrice = 90000m,
                VipPrice = 100000m,
                CouplePrice = 200000m
            });

        Assert.Equal(HttpStatusCode.Created, createShowtime.StatusCode);

        client.DefaultRequestHeaders.Authorization = null;
        var afterCreate = await client.GetAsync("/api/movies/now-showing");
        var movies =
            await afterCreate.Content.ReadFromJsonAsync<List<MovieResponse>>();

        Assert.Equal(HttpStatusCode.OK, afterCreate.StatusCode);
        Assert.Equal("MISS", GetCacheHeader(afterCreate));
        Assert.Contains(
            movies ?? [],
            movie => movie.Id == movieId);

        await factory.ExecuteScopeAsync(async services =>
        {
            var scheduling = services.GetRequiredService<SchedulingDbContext>();
            Assert.True(await scheduling.Showtimes.AnyAsync());
        });
    }

    [Fact]
    [Trait("Category", "RedisCache")]
    public async Task Redis_unavailable_fails_open_with_bypass_header()
    {
        using var factory =
            new RedisCacheApiFactory("localhost:6390,connectTimeout=100,connectRetry=0");
        var client = factory.CreateClient();

        await factory.ExecuteScopeAsync(async services =>
        {
            var dbContext = services.GetRequiredService<CatalogDbContext>();

            dbContext.Movies.Add(new Movie
            {
                Id = Guid.NewGuid(),
                Title = "Bypass Movie",
                Description = "Bypass description",
                DurationMinutes = 100,
                ReleaseDate = DateTime.UtcNow.Date,
                IsActive = true
            });

            await dbContext.SaveChangesAsync();
        });

        var response = await client.GetAsync("/api/movies");
        var movies =
            await response.Content.ReadFromJsonAsync<List<MovieResponse>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("BYPASS", GetCacheHeader(response));
        Assert.Contains(
            movies ?? [],
            movie => movie.Title == "Bypass Movie");
    }

    private static string GetCacheHeader(HttpResponseMessage response)
    {
        Assert.True(
            response.Headers.TryGetValues("X-Cache", out var values),
            "X-Cache header was not returned.");

        return Assert.Single(values);
    }
}
