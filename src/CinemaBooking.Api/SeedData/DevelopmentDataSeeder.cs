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

        foreach (var row in new[] { "A", "B", "C", "D", "E" })
        {
            for (var number = 1; number <= 8; number++)
            {
                var exists =
                    await dbContext.Seats.AnyAsync(seat =>
                        seat.RoomId == room.Id &&
                        seat.Row == row &&
                        seat.Number == number);

                if (exists)
                {
                    var seat =
                        await dbContext.Seats.FirstAsync(item =>
                            item.RoomId == room.Id &&
                            item.Row == row &&
                            item.Number == number);

                    seat.Type = GetSeedSeatType(row);

                    continue;
                }

                dbContext.Seats.Add(new Seat
                {
                    RoomId = room.Id,
                    Row = row,
                    Number = number,
                    Type = GetSeedSeatType(row)
                });
            }
        }

        await dbContext.SaveChangesAsync();

        return room;
    }

    private static SeatType GetSeedSeatType(string row)
    {
        return row switch
        {
            "E" => SeatType.Couple,
            "C" or "D" => SeatType.VIP,
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
                BasePrice = 120000 + index * 25000
            });
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
}
