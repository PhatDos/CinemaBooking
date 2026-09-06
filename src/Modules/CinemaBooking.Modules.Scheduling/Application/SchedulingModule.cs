using CinemaBooking.Modules.Scheduling.Contracts;
using CinemaBooking.Modules.Scheduling.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.Modules.Scheduling.Application;

public class SchedulingModule : ISchedulingModule
{
    private readonly SchedulingDbContext _dbContext;

    public SchedulingModule(SchedulingDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ShowtimeInfo?> GetShowtimeAsync(
        Guid showtimeId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Showtimes
            .AsNoTracking()
            .Where(showtime => showtime.Id == showtimeId)
            .Select(showtime => new ShowtimeInfo
            {
                Id = showtime.Id,
                RoomId = showtime.RoomId,
                MovieId = showtime.MovieId,
                StartTime = showtime.StartTime,
                EndTime = showtime.EndTime,
                BasePrice = showtime.BasePrice
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ShowtimeInfo>> GetShowtimesByMovieAsync(
        Guid movieId,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        return await _dbContext.Showtimes
            .AsNoTracking()
            .Where(showtime =>
                showtime.MovieId == movieId &&
                showtime.StartTime >= now)
            .OrderBy(showtime => showtime.StartTime)
            .Select(showtime => new ShowtimeInfo
            {
                Id = showtime.Id,
                RoomId = showtime.RoomId,
                MovieId = showtime.MovieId,
                StartTime = showtime.StartTime,
                EndTime = showtime.EndTime,
                BasePrice = showtime.BasePrice
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Guid>> GetUpcomingMovieIdsAsync(
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        return await _dbContext.Showtimes
            .AsNoTracking()
            .Where(showtime => showtime.StartTime >= now)
            .Select(showtime => showtime.MovieId)
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ShowtimeInfo>> GetShowtimesByRoomIdsAsync(
        IReadOnlyCollection<Guid> roomIds,
        DateTime? from = null,
        DateTime? to = null,
        bool includePast = false,
        CancellationToken cancellationToken = default)
    {
        if (roomIds.Count == 0)
        {
            return [];
        }

        var now = DateTime.UtcNow;
        var query = _dbContext.Showtimes
            .AsNoTracking()
            .Where(showtime => roomIds.Contains(showtime.RoomId));

        if (!includePast)
        {
            query = query.Where(showtime => showtime.StartTime >= now);
        }

        if (from is not null)
        {
            query = query.Where(showtime => showtime.StartTime >= from);
        }

        if (to is not null)
        {
            query = query.Where(showtime => showtime.StartTime <= to);
        }

        return await query
            .OrderBy(showtime => showtime.StartTime)
            .Select(showtime => new ShowtimeInfo
            {
                Id = showtime.Id,
                RoomId = showtime.RoomId,
                MovieId = showtime.MovieId,
                StartTime = showtime.StartTime,
                EndTime = showtime.EndTime,
                BasePrice = showtime.BasePrice
            })
            .ToListAsync(cancellationToken);
    }
}
