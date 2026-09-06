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
    private const string SeedProvinceCode = "79";
    private const string SeedProvinceName = "Thành phố Hồ Chí Minh";
    private const string SeedWardCode = "26740";
    private const string SeedWardName = "Phường Sài Gòn";
    private const string SeedAddressLine = "123 Seed Street";

    private static readonly SeedGenre[] Genres =
    [
        new(
            "Action",
            "action",
            "https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=900&q=80"),
        new(
            "Adventure",
            "adventure",
            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"),
        new(
            "Animation",
            "animation",
            "https://images.unsplash.com/photo-1635322966219-b75ed372eb01?auto=format&fit=crop&w=900&q=80"),
        new(
            "Comedy",
            "comedy",
            "https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=900&q=80"),
        new(
            "Documentary",
            "documentary",
            "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80"),
        new(
            "Drama",
            "drama",
            "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=900&q=80"),
        new(
            "Horror",
            "horror",
            "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=900&q=80"),
        new(
            "Romance",
            "romance",
            "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=900&q=80"),
        new(
            "Sci-Fi",
            "sci-fi",
            "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=900&q=80"),
        new(
            "Thriller",
            "thriller",
            "https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?auto=format&fit=crop&w=900&q=80")
    ];

    private static readonly SeedMovie[] Movies =
    [
        new(
            "Seed Movie: The Modular Monolith",
            "A clean architecture story for testing booking flow.",
            105,
            new DateTime(2026, 8, 29),
            "https://picsum.photos/seed/cinema-booking-modular/600/900",
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "Drama"),
        new(
            "Seed Movie: Redis Hold",
            "A thriller about one seat and too many users.",
            95,
            new DateTime(2026, 8, 29),
            "https://picsum.photos/seed/cinema-booking-redis/600/900",
            "https://youtu.be/dQw4w9WgXcQ",
            "Thriller"),
        new(
            "Seed Movie: SQL Final Boss",
            "A database correctness adventure.",
            120,
            new DateTime(2026, 8, 29),
            "https://picsum.photos/seed/cinema-booking-sql/600/900",
            "https://www.youtube.com/shorts/dQw4w9WgXcQ",
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

        var genres =
            await EnsureGenresAsync(catalogDbContext);

        var movies =
            await EnsureMoviesAsync(
                catalogDbContext,
                genres);

        var room =
            await EnsureTheaterAsync(theaterDbContext);

        await EnsureShowtimesAsync(
            schedulingDbContext,
            movies,
            room.Id);

        await NormalizeDevelopmentShowtimePricesAsync(
            schedulingDbContext);
    }

    private static async Task<IReadOnlyDictionary<string, Genre>> EnsureGenresAsync(
        CatalogDbContext dbContext)
    {
        foreach (var seedGenre in Genres)
        {
            var genre =
                await dbContext.Genres.FirstOrDefaultAsync(item =>
                    item.Slug == seedGenre.Slug);

            if (genre is not null)
            {
                genre.Name = seedGenre.Name;
                genre.ImageUrl = seedGenre.ImageUrl;

                continue;
            }

            dbContext.Genres.Add(new Genre
            {
                Name = seedGenre.Name,
                Slug = seedGenre.Slug,
                ImageUrl = seedGenre.ImageUrl,
                CreatedAt = DateTime.UtcNow
            });
        }

        await dbContext.SaveChangesAsync();

        return await dbContext.Genres
            .Where(genre =>
                Genres.Select(seedGenre => seedGenre.Slug)
                    .Contains(genre.Slug))
            .ToDictionaryAsync(
                genre => genre.Name,
                StringComparer.OrdinalIgnoreCase);
    }

    private static async Task<List<Movie>> EnsureMoviesAsync(
        CatalogDbContext dbContext,
        IReadOnlyDictionary<string, Genre> genresByName)
    {
        foreach (var seedMovie in Movies)
        {
            genresByName.TryGetValue(
                seedMovie.Genre,
                out var genre);

            var movie =
                await dbContext.Movies.FirstOrDefaultAsync(movie =>
                    movie.Title == seedMovie.Title);

            if (movie is not null)
            {
                movie.Description = seedMovie.Description;
                movie.DurationMinutes = seedMovie.DurationMinutes;
                movie.ReleaseDate = seedMovie.ReleaseDate;
                movie.PosterUrl ??= seedMovie.PosterUrl;
                movie.TrailerUrl = seedMovie.TrailerUrl;
                movie.GenreId = genre?.Id;
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
                GenreId = genre?.Id,
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
                Address = SeedAddressLine,
                City = SeedProvinceName,
                Description = "Development seed cinema",
                IsActive = true,
                ProvinceCode = SeedProvinceCode,
                ProvinceName = SeedProvinceName,
                WardCode = SeedWardCode,
                WardName = SeedWardName,
                AddressLine = SeedAddressLine
            };

            dbContext.Cinemas.Add(cinema);

            await dbContext.SaveChangesAsync();
        }
        else
        {
            cinema.Address = SeedAddressLine;
            cinema.City = SeedProvinceName;
            cinema.Description ??= "Development seed cinema";
            cinema.IsActive = true;
            cinema.ProvinceCode = SeedProvinceCode;
            cinema.ProvinceName = SeedProvinceName;
            cinema.WardCode = SeedWardCode;
            cinema.WardName = SeedWardName;
            cinema.AddressLine = SeedAddressLine;

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

    private sealed record SeedGenre(
        string Name,
        string Slug,
        string ImageUrl);

    private sealed record SeedSeat(
        string Row,
        int Number,
        SeatType Type);
}
