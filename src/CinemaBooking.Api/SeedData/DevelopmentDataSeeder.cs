using CinemaBooking.Modules.Catalog.Domain;
using CinemaBooking.Modules.Catalog.Infrastructure.Persistence;
using CinemaBooking.Modules.Scheduling.Domain;
using CinemaBooking.Modules.Scheduling.Infrastructure.Persistence;
using CinemaBooking.Modules.Theater.Domain;
using CinemaBooking.Modules.Theater.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.Api.SeedData;

public static class DevelopmentDataSeeder
{
    private const string CinemaName = "Seed Cinema";
    private const string RoomName = "Seed Room 1";
    private const decimal SeedBasePrice = 90000m;

    private static readonly SeedMovie[] Movies =
    [
        new(
            "Seed Movie: The Modular Monolith",
            "A clean architecture story for testing booking flow.",
            105,
            new DateTime(2026, 8, 29),
            "https://picsum.photos/seed/cinema-booking-modular/600/900",
            "https://www.youtube.com/results?search_query=modular+monolith+movie+trailer",
            "Drama"),
        new(
            "Seed Movie: Redis Hold",
            "A thriller about one seat and too many users.",
            95,
            new DateTime(2026, 8, 29),
            "https://picsum.photos/seed/cinema-booking-redis/600/900",
            "https://www.youtube.com/results?search_query=cinema+thriller+trailer",
            "Thriller"),
        new(
            "Seed Movie: SQL Final Boss",
            "A database correctness adventure.",
            120,
            new DateTime(2026, 8, 29),
            "https://picsum.photos/seed/cinema-booking-sql/600/900",
            "https://www.youtube.com/results?search_query=database+adventure+movie+trailer",
            "Adventure")
    ];

    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var catalogDbContext =
            scope.ServiceProvider.GetRequiredService<CatalogDbContext>();

        var theaterDbContext =
            scope.ServiceProvider.GetRequiredService<TheaterDbContext>();

        var schedulingDbContext =
            scope.ServiceProvider.GetRequiredService<SchedulingDbContext>();

        var movies =
            await EnsureMoviesAsync(catalogDbContext);

        var room =
            await EnsureTheaterAsync(theaterDbContext);

        await EnsureShowtimesAsync(
            schedulingDbContext,
            movies,
            room.Id);

        await NormalizeDevelopmentShowtimePricesAsync(
            schedulingDbContext);
    }

    private static async Task<List<Movie>> EnsureMoviesAsync(
        CatalogDbContext dbContext)
    {
        foreach (var seedMovie in Movies)
        {
            var movie =
                await dbContext.Movies.FirstOrDefaultAsync(movie =>
                    movie.Title == seedMovie.Title);

            if (movie is not null)
            {
                movie.Description = seedMovie.Description;
                movie.DurationMinutes = seedMovie.DurationMinutes;
                movie.ReleaseDate = seedMovie.ReleaseDate;
                movie.PosterUrl ??= seedMovie.PosterUrl;
                movie.TrailerUrl ??= seedMovie.TrailerUrl;
                movie.Genre = seedMovie.Genre;
                movie.IsActive = true;

                continue;
            }

            dbContext.Movies.Add(new Movie
            {
                Title = seedMovie.Title,
                Description = seedMovie.Description,
                DurationMinutes = seedMovie.DurationMinutes,
                ReleaseDate = seedMovie.ReleaseDate,
                PosterUrl = seedMovie.PosterUrl,
                TrailerUrl = seedMovie.TrailerUrl,
                Genre = seedMovie.Genre,
                IsActive = true
            });
        }

        await dbContext.SaveChangesAsync();

        return await dbContext.Movies
            .Where(movie =>
                Movies.Select(seedMovie => seedMovie.Title)
                    .Contains(movie.Title))
            .OrderBy(movie => movie.Title)
            .ToListAsync();
    }

    private static async Task<Room> EnsureTheaterAsync(
        TheaterDbContext dbContext)
    {
        var cinema =
            await dbContext.Cinemas
                .Include(item => item.Rooms)
                .FirstOrDefaultAsync(item =>
                    item.Name == CinemaName);

        if (cinema is null)
        {
            cinema = new Cinema
            {
                Name = CinemaName,
                Address = "123 Seed Street, District 1",
                City = "Ho Chi Minh City",
                Description = "Development seed cinema",
                IsActive = true
            };

            dbContext.Cinemas.Add(cinema);

            await dbContext.SaveChangesAsync();
        }
        else
        {
            cinema.Address = "123 Seed Street, District 1";
            cinema.City = string.IsNullOrWhiteSpace(cinema.City)
                ? "Ho Chi Minh City"
                : cinema.City;
            cinema.Description ??= "Development seed cinema";
            cinema.IsActive = true;

            await dbContext.SaveChangesAsync();
        }

        var room =
            await dbContext.Rooms
                .FirstOrDefaultAsync(item =>
                    item.CinemaId == cinema.Id &&
                    item.Name == RoomName);

        if (room is null)
        {
            room = new Room
            {
                CinemaId = cinema.Id,
                Name = RoomName,
                IsActive = true
            };

            dbContext.Rooms.Add(room);

            await dbContext.SaveChangesAsync();
        }
        else
        {
            room.IsActive = true;

            await dbContext.SaveChangesAsync();
        }

        await EnsureAllCinemaRoomsHaveSeedLayoutAsync(dbContext);

        return room;
    }

    private static async Task EnsureAllCinemaRoomsHaveSeedLayoutAsync(
        TheaterDbContext dbContext)
    {
        var cinemas =
            await dbContext.Cinemas
                .Include(cinema => cinema.Rooms)
                .ToListAsync();

        foreach (var cinema in cinemas)
        {
            if (cinema.Rooms.Count == 0)
            {
                var room = new Room
                {
                    CinemaId = cinema.Id,
                    Name = RoomName,
                    IsActive = true
                };

                dbContext.Rooms.Add(room);
                cinema.Rooms.Add(room);
            }
        }

        await dbContext.SaveChangesAsync();

        var roomIds =
            await dbContext.Rooms
                .Select(room => room.Id)
                .ToListAsync();

        foreach (var roomId in roomIds)
        {
            await EnsureSeedSeatLayoutAsync(dbContext, roomId);
        }
    }

    private static async Task EnsureSeedSeatLayoutAsync(
        TheaterDbContext dbContext,
        Guid roomId)
    {
        var desiredSeats =
            GetSeedSeatLayout()
                .ToArray();

        var desiredKeys =
            desiredSeats
                .Select(seat => $"{seat.Row}:{seat.Number}")
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var existingSeats =
            await dbContext.Seats
                .Where(seat => seat.RoomId == roomId)
                .ToListAsync();

        foreach (var existingSeat in existingSeats)
        {
            var key = $"{existingSeat.Row}:{existingSeat.Number}";

            if (!desiredKeys.Contains(key))
            {
                dbContext.Seats.Remove(existingSeat);

                continue;
            }

            existingSeat.Type =
                GetSeedSeatType(
                    existingSeat.Row,
                    existingSeat.Number);
        }

        var existingKeys =
            existingSeats
                .Select(seat => $"{seat.Row}:{seat.Number}")
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var desiredSeat in desiredSeats)
        {
            if (existingKeys.Contains($"{desiredSeat.Row}:{desiredSeat.Number}"))
            {
                continue;
            }

            dbContext.Seats.Add(new Seat
            {
                RoomId = roomId,
                Row = desiredSeat.Row,
                Number = desiredSeat.Number,
                Type = desiredSeat.Type
            });
        }

        await dbContext.SaveChangesAsync();
    }

    private static IEnumerable<SeedSeat> GetSeedSeatLayout()
    {
        foreach (var row in new[] { "A", "B", "C", "D" })
        {
            for (var number = 1; number <= 8; number++)
            {
                yield return new SeedSeat(
                    row,
                    number,
                    GetSeedSeatType(row, number));
            }
        }

        for (var number = 1; number <= 4; number++)
        {
            yield return new SeedSeat(
                "E",
                number,
                SeatType.Couple);
        }
    }

    private static SeatType GetSeedSeatType(
        string row,
        int number)
    {
        return row switch
        {
            "B" or "C" or "D" when number is >= 3 and <= 6 => SeatType.VIP,
            "E" => SeatType.Couple,
            _ => SeatType.Standard
        };
    }

    private static async Task EnsureShowtimesAsync(
        SchedulingDbContext dbContext,
        IReadOnlyList<Movie> movies,
        Guid roomId)
    {
        var hasSeedShowtimes =
            await dbContext.Showtimes.AnyAsync(showtime =>
                showtime.RoomId == roomId &&
                showtime.StartTime > DateTime.UtcNow);

        if (hasSeedShowtimes)
        {
            return;
        }

        var firstStart =
            DateTime.UtcNow.Date
                .AddDays(1)
                .AddHours(10);

        var startTimes = new[]
        {
            firstStart,
            firstStart.AddHours(3),
            firstStart.AddHours(6)
        };

        for (var index = 0; index < movies.Count; index++)
        {
            var movie = movies[index];
            var startTime = startTimes[index];

            dbContext.Showtimes.Add(new Showtime
            {
                MovieId = movie.Id,
                RoomId = roomId,
                StartTime = startTime,
                EndTime = startTime.AddMinutes(movie.DurationMinutes),
                BasePrice = SeedBasePrice
            });
        }

        await dbContext.SaveChangesAsync();
    }

    private static async Task NormalizeDevelopmentShowtimePricesAsync(
        SchedulingDbContext dbContext)
    {
        var showtimes =
            await dbContext.Showtimes
                .Where(showtime => showtime.BasePrice != SeedBasePrice)
                .ToListAsync();

        if (showtimes.Count == 0)
        {
            return;
        }

        foreach (var showtime in showtimes)
        {
            showtime.BasePrice = SeedBasePrice;
        }

        await dbContext.SaveChangesAsync();
    }

    private sealed record SeedMovie(
        string Title,
        string Description,
        int DurationMinutes,
        DateTime ReleaseDate,
        string PosterUrl,
        string TrailerUrl,
        string Genre);

    private sealed record SeedSeat(
        string Row,
        int Number,
        SeatType Type);
}
