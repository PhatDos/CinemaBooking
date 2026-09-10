using CinemaBooking.Modules.Catalog.Application.MovieImports;
using CinemaBooking.Modules.Catalog.Domain;
using CinemaBooking.Modules.Catalog.Domain.Imports;
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
    private const decimal MinimumSeedStandardPrice = 80000m;
    private const decimal MaximumSeedStandardPrice = 120000m;
    private const decimal SeedPriceStep = 10000m;
    private const int SeedRoomsPerCinema = 10;
    private const int SeedDays = 7;
    private const int SeedShowtimesPerMovieCinemaAndDate = 2;

    private static readonly TimeSpan[] SeedStartOffsets =
    [
        TimeSpan.FromHours(9),
        TimeSpan.FromHours(11.5),
        TimeSpan.FromHours(14),
        TimeSpan.FromHours(16.5),
        TimeSpan.FromHours(19),
        TimeSpan.FromHours(21.5)
    ];

    private static readonly string[] LegacyMovieTitles =
    [
        "Seed Movie: The Modular Monolith",
        "Seed Movie: Redis Hold",
        "Seed Movie: SQL Final Boss",
        "Saigon Night Run",
        "Moonlit Station",
        "The Last Projection"
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

        await EnsureGenresAsync(catalogDbContext);

        var movies =
            await GetApprovedMoveekMoviesAsync(catalogDbContext);

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
            cinemaContexts);
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

    private static async Task<List<Movie>> GetApprovedMoveekMoviesAsync(
        CatalogDbContext dbContext)
    {
        var movieIds =
            await dbContext.MovieImportCandidates
                .Where(candidate =>
                    candidate.Source == MoveekMovieImportProvider.ProviderSource &&
                    candidate.Status == MovieImportCandidateStatus.Approved &&
                    candidate.MatchMovieId.HasValue)
                .Select(candidate => candidate.MatchMovieId!.Value)
                .Distinct()
                .ToListAsync();

        if (movieIds.Count == 0)
        {
            return [];
        }

        return await dbContext.Movies
            .Where(movie =>
                movie.IsActive &&
                movieIds.Contains(movie.Id))
            .OrderBy(movie => movie.Title)
            .ToListAsync();
    }

    private static async Task<IReadOnlyList<SeedCinemaContext>> EnsureTheaterDependenciesAsync(
        TheaterDbContext dbContext)
    {
        var result = new List<SeedCinemaContext>();
        var cinemas =
            await dbContext.Cinemas
                .Where(cinema => cinema.IsActive)
                .OrderBy(cinema => cinema.Name)
                .ToListAsync();

        foreach (var cinema in cinemas)
        {
            var rooms =
                await dbContext.Rooms
                    .Where(room =>
                        room.CinemaId == cinema.Id)
                    .OrderBy(room => room.Name)
                    .ToListAsync();
            var existingRoomIds =
                rooms.Select(room => room.Id)
                    .ToArray();
            var existingRoomIdsWithSeats =
                await dbContext.Seats
                    .Where(seat =>
                        existingRoomIds.Contains(seat.RoomId))
                    .Select(seat => seat.RoomId)
                    .Distinct()
                    .ToListAsync();

            for (var roomNumber = 1; roomNumber <= SeedRoomsPerCinema; roomNumber++)
            {
                var roomName = $"Room {roomNumber}";
                var room =
                    rooms.FirstOrDefault(item =>
                        string.Equals(
                            item.Name,
                            roomName,
                            StringComparison.OrdinalIgnoreCase));

                if (room is null)
                {
                    room = new Room
                    {
                        CinemaId = cinema.Id,
                        Name = roomName,
                        IsActive = true
                    };

                    rooms.Add(room);
                    dbContext.Rooms.Add(room);
                }

                if (!existingRoomIdsWithSeats.Contains(room.Id))
                {
                    dbContext.Seats.AddRange(GetSeedSeatLayout(room.Id));
                    existingRoomIdsWithSeats.Add(room.Id);
                }
            }

            var roomIds = rooms
                .Where(room =>
                    room.IsActive &&
                    existingRoomIdsWithSeats.Contains(room.Id))
                .OrderBy(room => room.Name)
                .Select(room => room.Id)
                .ToList();

            result.Add(new SeedCinemaContext(
                cinema.Id,
                cinema.Name,
                roomIds));
        }

        await dbContext.SaveChangesAsync();

        return result;
    }

    private static IEnumerable<Seat> GetSeedSeatLayout(Guid roomId)
    {
        foreach (var row in new[] { "A", "B", "C", "D" })
        {
            for (var number = 1; number <= 8; number++)
            {
                yield return new Seat
                {
                    RoomId = roomId,
                    Row = row,
                    Number = number,
                    Type = GetSeedSeatType(row, number)
                };
            }
        }

        for (var number = 1; number <= 4; number++)
        {
            yield return new Seat
            {
                RoomId = roomId,
                Row = "E",
                Number = number,
                Type = SeatType.Couple
            };
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
        IReadOnlyList<SeedCinemaContext> cinemaContexts)
    {
        if (movies.Count == 0 ||
            cinemaContexts.Count == 0)
        {
            return;
        }

        var now = DateTime.UtcNow;
        var seedStartDate = now.Date.AddDays(1);
        var seedEndDate = seedStartDate.AddDays(SeedDays);
        var distinctRoomIds =
            cinemaContexts
                .SelectMany(context => context.ShowtimeRoomIds)
                .Distinct()
                .ToArray();

        if (distinctRoomIds.Length == 0)
        {
            return;
        }

        var scheduledShowtimes =
            await dbContext.Showtimes
                .Where(showtime =>
                    distinctRoomIds.Contains(showtime.RoomId) &&
                    showtime.EndTime > now &&
                    showtime.StartTime < seedEndDate)
                .ToListAsync();
        var scheduledShowtimesByRoom =
            distinctRoomIds.ToDictionary(
                roomId => roomId,
                roomId => scheduledShowtimes
                    .Where(showtime => showtime.RoomId == roomId)
                    .ToList());

        foreach (var context in cinemaContexts.Where(item => item.ShowtimeRoomIds.Count > 0))
        {
            var roomIds = context.ShowtimeRoomIds
                .Distinct()
                .OrderBy(roomId => scheduledShowtimesByRoom[roomId].Count)
                .ToArray();
            var cinemaShowtimes = roomIds
                .SelectMany(roomId => scheduledShowtimesByRoom[roomId])
                .ToList();

            for (var movieIndex = 0; movieIndex < movies.Count; movieIndex++)
            {
                var movie = movies[movieIndex];

                foreach (var existingShowtime in cinemaShowtimes.Where(showtime =>
                        showtime.MovieId == movie.Id &&
                        showtime.StartTime > now))
                {
                    if (HasValidSeedPrices(existingShowtime))
                    {
                        continue;
                    }

                    var prices = CreateSeedPrices();
                    existingShowtime.BasePrice = prices.StandardPrice;
                    existingShowtime.StandardPrice = prices.StandardPrice;
                    existingShowtime.VipPrice = prices.VipPrice;
                    existingShowtime.CouplePrice = prices.CouplePrice;
                }

                for (var dayIndex = 0; dayIndex < SeedDays; dayIndex++)
                {
                    var date = seedStartDate.AddDays(dayIndex);
                    var nextDate = date.AddDays(1);
                    var existingDateShowtimeCount =
                        cinemaShowtimes.Count(showtime =>
                            showtime.MovieId == movie.Id &&
                            showtime.StartTime >= date &&
                            showtime.StartTime < nextDate &&
                            showtime.StartTime > now);

                    for (var seedIndex = existingDateShowtimeCount;
                         seedIndex < SeedShowtimesPerMovieCinemaAndDate;
                         seedIndex++)
                    {
                        var scheduleIndex =
                            (movieIndex * SeedShowtimesPerMovieCinemaAndDate) + seedIndex;
                        var desiredStart = GetDesiredShowtimeStart(
                            date,
                            scheduleIndex,
                            roomIds.Length);
                        var availableSlot = roomIds
                            .OrderBy(roomId => scheduledShowtimesByRoom[roomId].Count)
                            .Select(roomId => new
                            {
                                RoomId = roomId,
                                StartTime = FindAvailableShowtimeStart(
                                    scheduledShowtimesByRoom[roomId],
                                    desiredStart,
                                    date.AddDays(1),
                                    movie.DurationMinutes)
                            })
                            .FirstOrDefault(slot => slot.StartTime.HasValue);

                        if (availableSlot is null)
                        {
                            continue;
                        }

                        var roomId = availableSlot.RoomId;
                        var roomShowtimes = scheduledShowtimesByRoom[roomId];
                        var startTime = availableSlot.StartTime;

                        if (!startTime.HasValue)
                        {
                            continue;
                        }

                        var prices = CreateSeedPrices();
                        var showtime = new Showtime
                        {
                            MovieId = movie.Id,
                            RoomId = roomId,
                            StartTime = startTime.Value,
                            EndTime = startTime.Value.AddMinutes(movie.DurationMinutes),
                            BasePrice = prices.StandardPrice,
                            StandardPrice = prices.StandardPrice,
                            VipPrice = prices.VipPrice,
                            CouplePrice = prices.CouplePrice
                        };

                        roomShowtimes.Add(showtime);
                        cinemaShowtimes.Add(showtime);
                        dbContext.Showtimes.Add(showtime);
                    }
                }
            }
        }

        await dbContext.SaveChangesAsync();
    }

    private static DateTime GetDesiredShowtimeStart(
        DateTime date,
        int scheduleIndex,
        int roomCount)
    {
        var offset =
            SeedStartOffsets[
                (scheduleIndex / roomCount) % SeedStartOffsets.Length];

        return date.Add(offset);
    }

    private static DateTime? FindAvailableShowtimeStart(
        IReadOnlyCollection<Showtime> scheduledShowtimes,
        DateTime desiredStart,
        DateTime latestStart,
        int durationMinutes)
    {
        var startTime = desiredStart;

        while (startTime < latestStart)
        {
            var endTime = startTime.AddMinutes(durationMinutes);
            var overlaps =
                scheduledShowtimes.Any(showtime =>
                    showtime.StartTime < endTime &&
                    showtime.EndTime > startTime);

            if (!overlaps)
            {
                return startTime;
            }

            startTime = startTime.AddMinutes(30);
        }

        return null;
    }

    private static SeedShowtimePrices CreateSeedPrices()
    {
        var standardSteps =
            (int)((MaximumSeedStandardPrice - MinimumSeedStandardPrice) /
                SeedPriceStep);
        var standard =
            MinimumSeedStandardPrice +
            (Random.Shared.Next(standardSteps + 1) * SeedPriceStep);
        var vip =
            standard +
            (Random.Shared.Next(1, 4) * SeedPriceStep);
        var couple =
            (vip * 2) +
            (Random.Shared.Next(0, 5) * SeedPriceStep);

        return new SeedShowtimePrices(
            standard,
            vip,
            couple);
    }

    private static bool HasValidSeedPrices(Showtime showtime)
    {
        return showtime.BasePrice == showtime.StandardPrice &&
            showtime.StandardPrice >= MinimumSeedStandardPrice &&
            showtime.StandardPrice <= MaximumSeedStandardPrice &&
            showtime.StandardPrice % SeedPriceStep == 0 &&
            showtime.VipPrice >= showtime.StandardPrice &&
            showtime.VipPrice - showtime.StandardPrice >= SeedPriceStep &&
            showtime.VipPrice - showtime.StandardPrice <= SeedPriceStep * 3 &&
            showtime.VipPrice % SeedPriceStep == 0 &&
            showtime.VipPrice <= showtime.CouplePrice / 2 &&
            showtime.CouplePrice - (showtime.VipPrice * 2) >= 0 &&
            showtime.CouplePrice - (showtime.VipPrice * 2) <= SeedPriceStep * 4 &&
            showtime.CouplePrice % SeedPriceStep == 0;
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

    private sealed record SeedGenre(
        string Name,
        string Slug,
        string ImageUrl);

    private sealed record SeedCinemaContext(
        Guid CinemaId,
        string CinemaName,
        IReadOnlyList<Guid> ShowtimeRoomIds);

    private sealed record SeedShowtimePrices(
        decimal StandardPrice,
        decimal VipPrice,
        decimal CouplePrice);
}
