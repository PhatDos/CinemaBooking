using CinemaBooking.Api.SeedData;
using CinemaBooking.Modules.Catalog.Domain;
using CinemaBooking.Modules.Catalog.Infrastructure.Persistence;
using CinemaBooking.Modules.Identity.Application.Roles;
using CinemaBooking.Modules.Identity.Domain;
using CinemaBooking.Modules.Identity.Infrastructure.Persistence;
using CinemaBooking.Modules.Scheduling.Domain;
using CinemaBooking.Modules.Scheduling.Infrastructure.Persistence;
using CinemaBooking.Modules.Theater.Domain;
using CinemaBooking.Modules.Theater.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CinemaBooking.UnitTests;

public class DevelopmentDataSeederTests
{
    private const string StaffPassword = "StaffPassword123!";

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
    public async Task SeedAsync_does_not_create_cinemas_when_database_has_no_clean_cinema_data()
    {
        using var services = CreateServices();

        await DevelopmentDataSeeder.SeedAsync(services);

        using var scope = services.CreateScope();
        var theater =
            scope.ServiceProvider.GetRequiredService<TheaterDbContext>();
        var scheduling =
            scope.ServiceProvider.GetRequiredService<SchedulingDbContext>();
        var identity =
            scope.ServiceProvider.GetRequiredService<IdentityDbContext>();

        Assert.Empty(await theater.Cinemas.ToListAsync());
        Assert.Empty(await theater.Rooms.ToListAsync());
        Assert.Empty(await theater.Seats.ToListAsync());
        Assert.Empty(await scheduling.Showtimes.ToListAsync());
        Assert.Empty(await identity.StaffCinemaAssignments.ToListAsync());
    }

    [Fact]
    public async Task SeedAsync_preserves_clean_cinema_fields_and_creates_related_demo_data()
    {
        using var services = CreateServices();
        var cinemaId = await AddCleanCinemaAsync(services);

        await DevelopmentDataSeeder.SeedAsync(services);

        using var scope = services.CreateScope();
        var theater =
            scope.ServiceProvider.GetRequiredService<TheaterDbContext>();
        var scheduling =
            scope.ServiceProvider.GetRequiredService<SchedulingDbContext>();
        var identity =
            scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var userManager =
            scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        var cinema =
            await theater.Cinemas.SingleAsync(item => item.Id == cinemaId);

        Assert.Equal("Clean Cinema", cinema.Name);
        Assert.Equal("1 Real Street", cinema.Address);
        Assert.Equal("Ho Chi Minh City", cinema.City);
        Assert.Equal("Keep this description", cinema.Description);
        Assert.Equal("https://example.com/cinema.jpg", cinema.ImageUrl);
        Assert.True(cinema.IsActive);

        var room =
            await theater.Rooms.SingleAsync(item => item.CinemaId == cinemaId);
        Assert.Equal("Room 1", room.Name);
        Assert.True(room.IsActive);

        var seats =
            await theater.Seats
                .Where(seat => seat.RoomId == room.Id)
                .ToListAsync();

        Assert.Equal(36, seats.Count);
        Assert.Equal(20, seats.Count(seat => seat.Type == SeatType.Standard));
        Assert.Equal(12, seats.Count(seat => seat.Type == SeatType.VIP));
        Assert.Equal(4, seats.Count(seat => seat.Type == SeatType.Couple));

        var showtimes =
            await scheduling.Showtimes
                .Where(showtime => showtime.RoomId == room.Id)
                .ToListAsync();

        Assert.Equal(3, showtimes.Count);
        Assert.All(showtimes, showtime =>
        {
            Assert.True(showtime.StartTime > DateTime.UtcNow);
            Assert.Equal(90000m, showtime.StandardPrice);
            Assert.Equal(100000m, showtime.VipPrice);
            Assert.Equal(200000m, showtime.CouplePrice);
        });

        var assignment =
            await identity.StaffCinemaAssignments
                .SingleAsync(item => item.CinemaId == cinemaId);
        var staff =
            await userManager.FindByIdAsync(assignment.UserId.ToString());

        Assert.NotNull(staff);
        Assert.Equal("staff.clean.cinema@cinema.local", staff.Email);
        Assert.True(await userManager.IsInRoleAsync(staff, AppRoles.Staff));
    }

    [Fact]
    public async Task SeedAsync_removes_legacy_movies_and_showtimes_without_removing_cinema_data()
    {
        using var services = CreateServices();
        Guid legacyCinemaId;
        Guid legacyRoomId;
        Guid legacyMovieId;

        using (var scope = services.CreateScope())
        {
            var catalog =
                scope.ServiceProvider.GetRequiredService<CatalogDbContext>();
            var theater =
                scope.ServiceProvider.GetRequiredService<TheaterDbContext>();
            var scheduling =
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
                Description = "Bulk movie",
                DurationMinutes = 90,
                ReleaseDate = DateTime.UtcNow.Date,
                IsActive = true
            };
            var smokeMovie = new Movie
            {
                Title = "Ticket Smoke Movie 1788314960",
                Description = "Smoke movie",
                DurationMinutes = 90,
                ReleaseDate = DateTime.UtcNow.Date,
                IsActive = true
            };
            var legacyCinema = new Cinema
            {
                Name = "Seed Cinema",
                Address = "Do not delete",
                City = "Ho Chi Minh City",
                IsActive = true
            };
            var legacyRoom = new Room
            {
                CinemaId = legacyCinema.Id,
                Name = "Legacy Room",
                IsActive = true
            };

            catalog.Movies.AddRange(
                legacyMovie,
                bulkMovie,
                smokeMovie);
            theater.Cinemas.Add(legacyCinema);
            theater.Rooms.Add(legacyRoom);
            theater.Seats.Add(new Seat
            {
                RoomId = legacyRoom.Id,
                Row = "A",
                Number = 1,
                Type = SeatType.Standard
            });
            scheduling.Showtimes.Add(new Showtime
            {
                MovieId = legacyMovie.Id,
                RoomId = legacyRoom.Id,
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(1).AddHours(2),
                BasePrice = 123000m,
                StandardPrice = 123000m,
                VipPrice = 133000m,
                CouplePrice = 223000m
            });

            await catalog.SaveChangesAsync();
            await theater.SaveChangesAsync();
            await scheduling.SaveChangesAsync();

            legacyCinemaId = legacyCinema.Id;
            legacyRoomId = legacyRoom.Id;
            legacyMovieId = legacyMovie.Id;
        }

        await DevelopmentDataSeeder.SeedAsync(services);

        using var verifyScope = services.CreateScope();
        var verifyCatalog =
            verifyScope.ServiceProvider.GetRequiredService<CatalogDbContext>();
        var verifyTheater =
            verifyScope.ServiceProvider.GetRequiredService<TheaterDbContext>();
        var verifyScheduling =
            verifyScope.ServiceProvider.GetRequiredService<SchedulingDbContext>();

        Assert.DoesNotContain(
            await verifyCatalog.Movies.Select(movie => movie.Title).ToListAsync(),
            LegacyMovieTitles.Contains);
        Assert.DoesNotContain(
            await verifyCatalog.Movies.Select(movie => movie.Title).ToListAsync(),
            title => LegacyMovieTitlePrefixes.Any(prefix =>
                title.StartsWith(prefix)));
        Assert.True(
            await verifyTheater.Cinemas.AnyAsync(cinema =>
                cinema.Id == legacyCinemaId &&
                cinema.Address == "Do not delete"));
        Assert.True(
            await verifyTheater.Rooms.AnyAsync(room => room.Id == legacyRoomId));
        Assert.False(
            await verifyScheduling.Showtimes.AnyAsync(showtime =>
                showtime.MovieId == legacyMovieId));
    }

    [Fact]
    public async Task SeedAsync_does_not_modify_existing_rooms_seats_or_showtime_prices()
    {
        using var services = CreateServices();
        Guid customRoomId;
        Guid customShowtimeId;

        using (var scope = services.CreateScope())
        {
            var theater =
                scope.ServiceProvider.GetRequiredService<TheaterDbContext>();
            var scheduling =
                scope.ServiceProvider.GetRequiredService<SchedulingDbContext>();

            var cinema = new Cinema
            {
                Name = "Independent Cinema",
                Address = "1 Custom Street",
                City = "Custom City",
                IsActive = true
            };
            var room = new Room
            {
                CinemaId = cinema.Id,
                Name = "Private Hall",
                IsActive = true
            };
            var showtime = new Showtime
            {
                MovieId = Guid.NewGuid(),
                RoomId = room.Id,
                StartTime = DateTime.UtcNow.AddDays(2),
                EndTime = DateTime.UtcNow.AddDays(2).AddHours(2),
                BasePrice = 123456m,
                StandardPrice = 123456m,
                VipPrice = 133456m,
                CouplePrice = 223456m
            };

            theater.Cinemas.Add(cinema);
            theater.Rooms.Add(room);
            theater.Seats.Add(new Seat
            {
                RoomId = room.Id,
                Row = "Z",
                Number = 99,
                Type = SeatType.VIP
            });
            scheduling.Showtimes.Add(showtime);

            await theater.SaveChangesAsync();
            await scheduling.SaveChangesAsync();

            customRoomId = room.Id;
            customShowtimeId = showtime.Id;
        }

        await DevelopmentDataSeeder.SeedAsync(services);

        using var verifyScope = services.CreateScope();
        var verifyTheater =
            verifyScope.ServiceProvider.GetRequiredService<TheaterDbContext>();
        var verifyScheduling =
            verifyScope.ServiceProvider.GetRequiredService<SchedulingDbContext>();

        var customSeats =
            await verifyTheater.Seats
                .Where(seat => seat.RoomId == customRoomId)
                .ToListAsync();
        var persistedCustomShowtime =
            await verifyScheduling.Showtimes.SingleAsync(showtime =>
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

    [Fact]
    public async Task SeedAsync_is_idempotent_for_related_data()
    {
        using var services = CreateServices();
        var firstCinemaId = await AddCleanCinemaAsync(
            services,
            "Alpha Cinema");
        var secondCinemaId = await AddCleanCinemaAsync(
            services,
            "Beta Cinema");

        await DevelopmentDataSeeder.SeedAsync(services);
        await DevelopmentDataSeeder.SeedAsync(services);

        using var scope = services.CreateScope();
        var theater =
            scope.ServiceProvider.GetRequiredService<TheaterDbContext>();
        var scheduling =
            scope.ServiceProvider.GetRequiredService<SchedulingDbContext>();
        var identity =
            scope.ServiceProvider.GetRequiredService<IdentityDbContext>();

        Assert.Equal(2, await theater.Cinemas.CountAsync());
        Assert.Equal(2, await theater.Rooms.CountAsync());
        Assert.Equal(72, await theater.Seats.CountAsync());
        Assert.Equal(6, await scheduling.Showtimes.CountAsync());
        Assert.Equal(
            2,
            await identity.StaffCinemaAssignments
                .Where(assignment =>
                    assignment.CinemaId == firstCinemaId ||
                    assignment.CinemaId == secondCinemaId)
                .CountAsync());
    }

    private static async Task<Guid> AddCleanCinemaAsync(
        ServiceProvider services,
        string name = "Clean Cinema")
    {
        using var scope = services.CreateScope();
        var theater =
            scope.ServiceProvider.GetRequiredService<TheaterDbContext>();
        var cinema = new Cinema
        {
            Name = name,
            Address = "1 Real Street",
            City = "Ho Chi Minh City",
            Description = "Keep this description",
            ImageUrl = "https://example.com/cinema.jpg",
            IsActive = true,
            ProvinceCode = "79",
            ProvinceName = "Ho Chi Minh City",
            WardCode = "26740",
            WardName = "Sai Gon Ward",
            AddressLine = "1 Real Street"
        };

        theater.Cinemas.Add(cinema);
        await theater.SaveChangesAsync();

        return cinema.Id;
    }

    private static ServiceProvider CreateServices()
    {
        var databaseName = Guid.NewGuid().ToString();
        var services = new ServiceCollection();
        var configuration =
            new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["StaffSeed:Password"] = StaffPassword
                })
                .Build();

        services.AddDbContext<CatalogDbContext>(options =>
            options.UseInMemoryDatabase($"{databaseName}-catalog"));
        services.AddDbContext<TheaterDbContext>(options =>
            options.UseInMemoryDatabase($"{databaseName}-theater"));
        services.AddDbContext<SchedulingDbContext>(options =>
            options.UseInMemoryDatabase($"{databaseName}-scheduling"));
        services.AddDbContext<IdentityDbContext>(options =>
            options.UseInMemoryDatabase($"{databaseName}-identity"));
        services
            .AddIdentityCore<ApplicationUser>()
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<IdentityDbContext>();
        services.AddSingleton<IConfiguration>(configuration);

        return services.BuildServiceProvider();
    }
}
