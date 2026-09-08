using CinemaBooking.Api.SeedData;
using CinemaBooking.Modules.Catalog.Domain;
using CinemaBooking.Modules.Catalog.Infrastructure.Persistence;
using CinemaBooking.Modules.Identity.Infrastructure.Persistence;
using CinemaBooking.Modules.Scheduling.Domain;
using CinemaBooking.Modules.Scheduling.Infrastructure.Persistence;
using CinemaBooking.Modules.Theater.Domain;
using CinemaBooking.Modules.Theater.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CinemaBooking.UnitTests;

public class DevelopmentDataSeederTests
{
    private static readonly string[] SeedCinemaNames =
    [
        "CGV Vincom Dong Khoi",
        "Galaxy Nguyen Du",
        "CGV Vincom Ba Trieu",
        "Lotte Cinema Da Nang",
        "Beta Cinemas Can Tho",
        "CGV Aeon Mall Hai Phong"
    ];

    private static readonly string[] SeedCities =
    [
        "Ho Chi Minh City",
        "Ha Noi",
        "Da Nang",
        "Can Tho",
        "Hai Phong"
    ];

    private static readonly string[] LegacyMovieTitles =
    [
        "Seed Movie: The Modular Monolith",
        "Seed Movie: Redis Hold",
        "Seed Movie: SQL Final Boss"
    ];

    private static readonly string[] LegacyMovieTitlePrefixes =
    [
        "Bulk Movie ",
        "Ticket Smoke Movie "
    ];

    [Fact]
    public async Task SeedAsync_creates_city_grouped_cinemas_with_default_room_seats_and_showtimes()
    {
        using var services = CreateServices();

        await DevelopmentDataSeeder.SeedAsync(services);

        using var scope = services.CreateScope();
        var theaterDbContext =
            scope.ServiceProvider.GetRequiredService<TheaterDbContext>();
        var schedulingDbContext =
            scope.ServiceProvider.GetRequiredService<SchedulingDbContext>();

        var cinemas =
            await theaterDbContext.Cinemas
                .Include(cinema => cinema.Rooms)
                .Where(cinema => SeedCinemaNames.Contains(cinema.Name))
                .ToListAsync();

        Assert.Equal(SeedCinemaNames.Length, cinemas.Count);

        foreach (var city in SeedCities)
        {
            Assert.Contains(cinemas, cinema => cinema.City == city);
        }

        foreach (var cinema in cinemas)
        {
            var room = Assert.Single(
                cinema.Rooms,
                item => item.Name == "Room 1");

            var seats =
                await theaterDbContext.Seats
                    .Where(seat => seat.RoomId == room.Id)
                    .ToListAsync();

            Assert.Equal(36, seats.Count);
            Assert.Equal(20, seats.Count(seat => seat.Type == SeatType.Standard));
            Assert.Equal(12, seats.Count(seat => seat.Type == SeatType.VIP));
            Assert.Equal(4, seats.Count(seat => seat.Type == SeatType.Couple));
        }

        var seedRoomIds =
            cinemas
                .SelectMany(cinema => cinema.Rooms)
                .Select(room => room.Id)
                .ToHashSet();

        var showtimes =
            await schedulingDbContext.Showtimes
                .Where(showtime => seedRoomIds.Contains(showtime.RoomId))
                .ToListAsync();

        Assert.Equal(seedRoomIds.Count * 3, showtimes.Count);
        Assert.All(showtimes, showtime =>
        {
            Assert.True(showtime.StartTime > DateTime.UtcNow);
            Assert.Equal(90000m, showtime.BasePrice);
            Assert.Equal(90000m, showtime.StandardPrice);
            Assert.Equal(100000m, showtime.VipPrice);
            Assert.Equal(200000m, showtime.CouplePrice);
        });
    }

    [Fact]
    public async Task SeedAsync_removes_legacy_seed_cinema_and_movies()
    {
        using var services = CreateServices();
        Guid legacyMovieId;
        Guid bulkMovieId;
        Guid smokeMovieId;
        Guid legacyRoomId;

        using (var scope = services.CreateScope())
        {
            var catalogDbContext =
                scope.ServiceProvider.GetRequiredService<CatalogDbContext>();
            var theaterDbContext =
                scope.ServiceProvider.GetRequiredService<TheaterDbContext>();
            var schedulingDbContext =
                scope.ServiceProvider.GetRequiredService<SchedulingDbContext>();

            var legacyMovie = new Movie
            {
                Title = LegacyMovieTitles[0],
                Description = "Legacy movie",
                DurationMinutes = 90,
                ReleaseDate = DateTime.UtcNow.Date,
                IsActive = true
            };
            var bulkMovie = new Movie
            {
                Title = "Bulk Movie 1788312476 1",
                Description = "Bulk test movie",
                DurationMinutes = 90,
                ReleaseDate = DateTime.UtcNow.Date,
                TrailerUrl = "https://example.com/trailer-1",
                IsActive = true
            };
            var smokeMovie = new Movie
            {
                Title = "Ticket Smoke Movie 1788314960",
                Description = "Smoke test movie",
                DurationMinutes = 90,
                ReleaseDate = DateTime.UtcNow.Date,
                IsActive = true
            };
            var legacyCinema = new Cinema
            {
                Name = "Seed Cinema",
                Address = "123 Seed Street",
                City = "Ho Chi Minh City",
                IsActive = true
            };
            var legacyRoom = new Room
            {
                CinemaId = legacyCinema.Id,
                Name = "Seed Room 1",
                IsActive = true
            };

            catalogDbContext.Movies.AddRange(
                legacyMovie,
                bulkMovie,
                smokeMovie);
            theaterDbContext.Cinemas.Add(legacyCinema);
            theaterDbContext.Rooms.Add(legacyRoom);
            theaterDbContext.Seats.Add(new Seat
            {
                RoomId = legacyRoom.Id,
                Row = "A",
                Number = 1,
                Type = SeatType.Standard
            });

            schedulingDbContext.Showtimes.AddRange(
                new Showtime
                {
                    MovieId = legacyMovie.Id,
                    RoomId = Guid.NewGuid(),
                    StartTime = DateTime.UtcNow.AddDays(1),
                    EndTime = DateTime.UtcNow.AddDays(1).AddHours(2),
                    BasePrice = 123000m,
                    StandardPrice = 123000m,
                    VipPrice = 133000m,
                    CouplePrice = 223000m
                },
                new Showtime
                {
                    MovieId = Guid.NewGuid(),
                    RoomId = legacyRoom.Id,
                    StartTime = DateTime.UtcNow.AddDays(1),
                    EndTime = DateTime.UtcNow.AddDays(1).AddHours(2),
                    BasePrice = 124000m,
                    StandardPrice = 124000m,
                    VipPrice = 134000m,
                    CouplePrice = 224000m
                });

            await catalogDbContext.SaveChangesAsync();
            await theaterDbContext.SaveChangesAsync();
            await schedulingDbContext.SaveChangesAsync();

            legacyMovieId = legacyMovie.Id;
            bulkMovieId = bulkMovie.Id;
            smokeMovieId = smokeMovie.Id;
            legacyRoomId = legacyRoom.Id;
        }

        await DevelopmentDataSeeder.SeedAsync(services);

        using var verifyScope = services.CreateScope();
        var catalog =
            verifyScope.ServiceProvider.GetRequiredService<CatalogDbContext>();
        var theater =
            verifyScope.ServiceProvider.GetRequiredService<TheaterDbContext>();
        var scheduling =
            verifyScope.ServiceProvider.GetRequiredService<SchedulingDbContext>();

        Assert.DoesNotContain(
            await catalog.Movies.Select(movie => movie.Title).ToListAsync(),
            LegacyMovieTitles.Contains);
        Assert.DoesNotContain(
            await catalog.Movies.Select(movie => movie.Title).ToListAsync(),
            title => LegacyMovieTitlePrefixes.Any(prefix =>
                title.StartsWith(prefix)));
        Assert.False(
            await theater.Cinemas.AnyAsync(cinema => cinema.Name == "Seed Cinema"));
        Assert.False(
            await theater.Rooms.AnyAsync(room => room.Id == legacyRoomId));
        Assert.False(
            await theater.Seats.AnyAsync(seat => seat.RoomId == legacyRoomId));
        Assert.False(
            await scheduling.Showtimes.AnyAsync(showtime =>
                showtime.MovieId == legacyMovieId ||
                showtime.MovieId == bulkMovieId ||
                showtime.MovieId == smokeMovieId ||
                showtime.RoomId == legacyRoomId));
    }

    [Fact]
    public async Task SeedAsync_does_not_modify_custom_cinema_rooms_or_showtime_prices()
    {
        using var services = CreateServices();
        Guid customRoomId;
        Guid customShowtimeId;

        using (var scope = services.CreateScope())
        {
            var theaterDbContext =
                scope.ServiceProvider.GetRequiredService<TheaterDbContext>();
            var schedulingDbContext =
                scope.ServiceProvider.GetRequiredService<SchedulingDbContext>();

            var customCinema = new Cinema
            {
                Name = "Independent Cinema",
                Address = "1 Custom Street",
                City = "Custom City",
                IsActive = true
            };
            var customRoom = new Room
            {
                CinemaId = customCinema.Id,
                Name = "Private Hall",
                IsActive = true
            };
            var customShowtime = new Showtime
            {
                MovieId = Guid.NewGuid(),
                RoomId = customRoom.Id,
                StartTime = DateTime.UtcNow.AddDays(2),
                EndTime = DateTime.UtcNow.AddDays(2).AddHours(2),
                BasePrice = 123456m,
                StandardPrice = 123456m,
                VipPrice = 133456m,
                CouplePrice = 223456m
            };

            theaterDbContext.Cinemas.Add(customCinema);
            theaterDbContext.Rooms.Add(customRoom);
            theaterDbContext.Seats.Add(new Seat
            {
                RoomId = customRoom.Id,
                Row = "Z",
                Number = 99,
                Type = SeatType.VIP
            });
            schedulingDbContext.Showtimes.Add(customShowtime);

            await theaterDbContext.SaveChangesAsync();
            await schedulingDbContext.SaveChangesAsync();

            customRoomId = customRoom.Id;
            customShowtimeId = customShowtime.Id;
        }

        await DevelopmentDataSeeder.SeedAsync(services);

        using var verifyScope = services.CreateScope();
        var theater =
            verifyScope.ServiceProvider.GetRequiredService<TheaterDbContext>();
        var scheduling =
            verifyScope.ServiceProvider.GetRequiredService<SchedulingDbContext>();

        var customSeats =
            await theater.Seats
                .Where(seat => seat.RoomId == customRoomId)
                .ToListAsync();
        var persistedCustomShowtime =
            await scheduling.Showtimes.SingleAsync(showtime =>
                showtime.Id == customShowtimeId);

        var customSeat = Assert.Single(customSeats);
        Assert.Equal("Z", customSeat.Row);
        Assert.Equal(99, customSeat.Number);
        Assert.Equal(SeatType.VIP, customSeat.Type);
        Assert.Equal(123456m, persistedCustomShowtime.BasePrice);
        Assert.Equal(123456m, persistedCustomShowtime.StandardPrice);
        Assert.Equal(133456m, persistedCustomShowtime.VipPrice);
        Assert.Equal(223456m, persistedCustomShowtime.CouplePrice);
    }

    private static ServiceProvider CreateServices()
    {
        var databaseName = Guid.NewGuid().ToString();
        var services = new ServiceCollection();

        services.AddDbContext<CatalogDbContext>(options =>
            options.UseInMemoryDatabase($"{databaseName}-catalog"));
        services.AddDbContext<TheaterDbContext>(options =>
            options.UseInMemoryDatabase($"{databaseName}-theater"));
        services.AddDbContext<SchedulingDbContext>(options =>
            options.UseInMemoryDatabase($"{databaseName}-scheduling"));
        services.AddDbContext<IdentityDbContext>(options =>
            options.UseInMemoryDatabase($"{databaseName}-identity"));
        services.AddSingleton<IConfiguration>(
            new ConfigurationBuilder().Build());

        return services.BuildServiceProvider();
    }
}
