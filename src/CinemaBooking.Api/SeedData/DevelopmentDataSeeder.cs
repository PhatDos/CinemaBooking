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
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace CinemaBooking.Api.SeedData;

public static class DevelopmentDataSeeder
{
    private const string DefaultRoomName = "Room 1";
    private const decimal SeedBasePrice = 90000m;
    private const decimal SeedVipPrice = 100000m;
    private const decimal SeedCouplePrice = 200000m;

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
            "Crime",
            "crime",
            "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=900&q=80"),
        new(
            "Documentary",
            "documentary",
            "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80"),
        new(
            "Drama",
            "drama",
            "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=900&q=80"),
        new(
            "Family",
            "family",
            "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80"),
        new(
            "Fantasy",
            "fantasy",
            "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=900&q=80"),
        new(
            "Horror",
            "horror",
            "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=900&q=80"),
        new(
            "Mystery",
            "mystery",
            "https://images.unsplash.com/photo-1503437313881-503a91226402?auto=format&fit=crop&w=900&q=80"),
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
            "Saigon Night Run",
            "A courier crosses the city to uncover a hidden theater conspiracy.",
            105,
            new DateTime(2026, 8, 29),
            "https://picsum.photos/seed/saigon-night-run/600/900",
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "Action"),
        new(
            "Moonlit Station",
            "Two strangers meet on the final train and chase a story neither can forget.",
            95,
            new DateTime(2026, 8, 29),
            "https://picsum.photos/seed/moonlit-station/600/900",
            "https://youtu.be/dQw4w9WgXcQ",
            "Romance"),
        new(
            "The Last Projection",
            "A projectionist finds an impossible reel that changes every screening.",
            120,
            new DateTime(2026, 8, 29),
            "https://picsum.photos/seed/the-last-projection/600/900",
            "https://www.youtube.com/shorts/dQw4w9WgXcQ",
            "Mystery")
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

        var identityDbContext =
            scope.ServiceProvider.GetRequiredService<IdentityDbContext>();

        var userManager =
            scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        var roleManager =
            scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

        var configuration =
            scope.ServiceProvider.GetRequiredService<IConfiguration>();

        await RemoveLegacySeedDataAsync(
            catalogDbContext,
            schedulingDbContext);

        var genres =
            await EnsureGenresAsync(catalogDbContext);

        var movies =
            await EnsureMoviesAsync(
                catalogDbContext,
                genres);

        var cinemaContexts =
            await EnsureTheaterDependenciesAsync(theaterDbContext);

        await EnsureSeedStaffAssignmentsAsync(
            identityDbContext,
            userManager,
            roleManager,
            configuration,
            cinemaContexts);

        await EnsureShowtimesAsync(
            schedulingDbContext,
            movies,
            cinemaContexts
                .Where(context => context.ShowtimeRoomId.HasValue)
                .Select(context => context.ShowtimeRoomId!.Value)
                .ToArray());
    }

    private static async Task RemoveLegacySeedDataAsync(
        CatalogDbContext catalogDbContext,
        SchedulingDbContext schedulingDbContext)
    {
        var legacyMovieIds =
            await catalogDbContext.Movies
                .Where(movie =>
                    LegacyMovieTitles.Contains(movie.Title) ||
                    movie.Title.StartsWith(LegacyMovieTitlePrefixes[0]) ||
                    movie.Title.StartsWith(LegacyMovieTitlePrefixes[1]))
                .Select(movie => movie.Id)
                .ToListAsync();

        if (legacyMovieIds.Count > 0)
        {
            var legacyMovieShowtimes =
                await schedulingDbContext.Showtimes
                    .Where(showtime =>
                        legacyMovieIds.Contains(showtime.MovieId))
                    .ToListAsync();

            if (legacyMovieShowtimes.Count > 0)
            {
                schedulingDbContext.Showtimes.RemoveRange(
                    legacyMovieShowtimes);

                await schedulingDbContext.SaveChangesAsync();
            }
        }

        var legacyMovies =
            await catalogDbContext.Movies
                .Where(movie =>
                    LegacyMovieTitles.Contains(movie.Title) ||
                    movie.Title.StartsWith(LegacyMovieTitlePrefixes[0]) ||
                    movie.Title.StartsWith(LegacyMovieTitlePrefixes[1]))
                .ToListAsync();

        if (legacyMovies.Count > 0)
        {
            var legacyMovieGenres =
                await catalogDbContext.MovieGenres
                    .Where(movieGenre =>
                        legacyMovieIds.Contains(movieGenre.MovieId))
                    .ToListAsync();

            if (legacyMovieGenres.Count > 0)
            {
                catalogDbContext.MovieGenres.RemoveRange(legacyMovieGenres);
            }

            catalogDbContext.Movies.RemoveRange(legacyMovies);

            await catalogDbContext.SaveChangesAsync();
        }
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
                await dbContext.Movies
                    .Include(movie => movie.MovieGenres)
                    .FirstOrDefaultAsync(movie =>
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
                EnsureMovieGenre(movie, genre);

                continue;
            }

            var newMovie = new Movie
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
            };

            EnsureMovieGenre(newMovie, genre);
            dbContext.Movies.Add(newMovie);
        }

        await dbContext.SaveChangesAsync();

        return await dbContext.Movies
            .Where(movie =>
                Movies.Select(seedMovie => seedMovie.Title)
                    .Contains(movie.Title))
            .OrderBy(movie => movie.Title)
            .ToListAsync();
    }

    private static void EnsureMovieGenre(
        Movie movie,
        Genre? genre)
    {
        if (genre is null ||
            movie.MovieGenres.Any(movieGenre =>
                movieGenre.GenreId == genre.Id))
        {
            return;
        }

        movie.MovieGenres.Add(new MovieGenre
        {
            MovieId = movie.Id,
            GenreId = genre.Id,
            CreatedAt = DateTime.UtcNow
        });
    }

    private static async Task<IReadOnlyList<SeedCinemaContext>> EnsureTheaterDependenciesAsync(
        TheaterDbContext dbContext)
    {
        var result = new List<SeedCinemaContext>();
        var cinemas =
            await dbContext.Cinemas
                .Include(cinema => cinema.Rooms)
                .Where(cinema => cinema.IsActive)
                .OrderBy(cinema => cinema.Name)
                .ToListAsync();

        foreach (var cinema in cinemas)
        {
            var room =
                cinema.Rooms
                    .OrderByDescending(item => item.IsActive)
                    .ThenBy(item => item.Name)
                    .FirstOrDefault();

            if (room is null)
            {
                room = new Room
                {
                    CinemaId = cinema.Id,
                    Name = DefaultRoomName,
                    IsActive = true
                };

                dbContext.Rooms.Add(room);

                await dbContext.SaveChangesAsync();
                await EnsureSeedSeatLayoutAsync(dbContext, room.Id);
            }

            var roomIds =
                await dbContext.Rooms
                    .Where(item => item.CinemaId == cinema.Id)
                    .Select(item => item.Id)
                    .ToListAsync();

            var roomIdWithSeats =
                await dbContext.Seats
                    .Where(seat => roomIds.Contains(seat.RoomId))
                    .GroupBy(seat => seat.RoomId)
                    .OrderBy(group => group.Key)
                    .Select(group => (Guid?)group.Key)
                    .FirstOrDefaultAsync();

            result.Add(new SeedCinemaContext(
                cinema.Id,
                cinema.Name,
                roomIdWithSeats));
        }

        return result;
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
        IReadOnlyList<Guid> roomIds)
    {
        if (roomIds.Count == 0)
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

        for (var roomIndex = 0; roomIndex < roomIds.Count; roomIndex++)
        {
            var roomId = roomIds[roomIndex];
            var hasSeedShowtimes =
                await dbContext.Showtimes.AnyAsync(showtime =>
                    showtime.RoomId == roomId &&
                    showtime.StartTime > DateTime.UtcNow);

            if (hasSeedShowtimes)
            {
                continue;
            }

            for (var movieIndex = 0; movieIndex < movies.Count; movieIndex++)
            {
                var movie = movies[movieIndex];
                var startTime = startTimes[movieIndex % startTimes.Length]
                    .AddDays(movieIndex / startTimes.Length)
                    .AddMinutes(roomIndex * 20);

                dbContext.Showtimes.Add(new Showtime
                {
                    MovieId = movie.Id,
                    RoomId = roomId,
                    StartTime = startTime,
                    EndTime = startTime.AddMinutes(movie.DurationMinutes),
                    BasePrice = SeedBasePrice,
                    StandardPrice = SeedBasePrice,
                    VipPrice = SeedVipPrice,
                    CouplePrice = SeedCouplePrice
                });
            }
        }

        await dbContext.SaveChangesAsync();
    }

    private static async Task EnsureSeedStaffAssignmentsAsync(
        IdentityDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole<Guid>> roleManager,
        IConfiguration configuration,
        IReadOnlyList<SeedCinemaContext> cinemaContexts)
    {
        var staffPassword =
            configuration["StaffSeed:Password"];

        if (string.IsNullOrWhiteSpace(staffPassword) ||
            cinemaContexts.Count == 0)
        {
            return;
        }

        if (!await roleManager.RoleExistsAsync(AppRoles.Staff))
        {
            var roleResult =
                await roleManager.CreateAsync(
                    new IdentityRole<Guid>(AppRoles.Staff));

            if (!roleResult.Succeeded)
            {
                throw new InvalidOperationException(
                    BuildIdentityErrorMessage(roleResult.Errors));
            }
        }

        var usedSlugs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var context in cinemaContexts)
        {
            var slug = CreateSlug(context.CinemaName);

            if (!usedSlugs.Add(slug))
            {
                slug = $"{slug}.{context.CinemaId:N}"[..(slug.Length + 9)];
                usedSlugs.Add(slug);
            }

            var staffEmail = $"staff.{slug}@cinema.local";
            var staff =
                await userManager.FindByEmailAsync(staffEmail);

            if (staff is null)
            {
                staff = new ApplicationUser
                {
                    Id = Guid.NewGuid(),
                    UserName = staffEmail,
                    Email = staffEmail,
                    EmailConfirmed = true,
                    CreatedAt = DateTime.UtcNow
                };

                var createResult =
                    await userManager.CreateAsync(
                        staff,
                        staffPassword);

                if (!createResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        BuildIdentityErrorMessage(createResult.Errors));
                }
            }

            if (!await userManager.IsInRoleAsync(staff, AppRoles.Staff))
            {
                var addRoleResult =
                    await userManager.AddToRoleAsync(staff, AppRoles.Staff);

                if (!addRoleResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        BuildIdentityErrorMessage(addRoleResult.Errors));
                }
            }

            var alreadyAssigned =
                await dbContext.StaffCinemaAssignments
                    .AnyAsync(assignment =>
                        assignment.UserId == staff.Id &&
                        assignment.CinemaId == context.CinemaId);

            if (alreadyAssigned)
            {
                continue;
            }

            dbContext.StaffCinemaAssignments.Add(
                new StaffCinemaAssignment
                {
                    UserId = staff.Id,
                    CinemaId = context.CinemaId,
                    CreatedAt = DateTime.UtcNow
                });
        }

        await dbContext.SaveChangesAsync();
    }

    private static string CreateSlug(
        string value)
    {
        var normalized =
            value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder();
        var lastWasSeparator = false;

        foreach (var character in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) ==
                UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            if (character <= 127 &&
                char.IsLetterOrDigit(character))
            {
                builder.Append(
                    char.ToLowerInvariant(character));
                lastWasSeparator = false;
                continue;
            }

            if (!lastWasSeparator)
            {
                builder.Append('.');
                lastWasSeparator = true;
            }
        }

        var slug =
            Regex.Replace(
                builder.ToString().Trim('.'),
                @"\.+",
                ".");

        return string.IsNullOrWhiteSpace(slug)
            ? "cinema"
            : slug;
    }

    private static string BuildIdentityErrorMessage(
        IEnumerable<IdentityError> errors)
    {
        return string.Join(
            "; ",
            errors.Select(error => error.Description));
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

    private sealed record SeedCinemaContext(
        Guid CinemaId,
        string CinemaName,
        Guid? ShowtimeRoomId);

    private sealed record SeedSeat(
        string Row,
        int Number,
        SeatType Type);
}
