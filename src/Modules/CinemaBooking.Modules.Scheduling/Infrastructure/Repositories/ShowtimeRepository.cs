using System.Data;
using CinemaBooking.Modules.Scheduling.Application.Interfaces;
using CinemaBooking.Modules.Scheduling.Domain;
using CinemaBooking.Modules.Scheduling.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.Modules.Scheduling.Infrastructure.Repositories;

public class ShowtimeRepository : IShowtimeRepository
{
    private readonly SchedulingDbContext _dbContext;

    public ShowtimeRepository(SchedulingDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(
        Showtime showtime,
        CancellationToken cancellationToken = default)
    {
        _dbContext.Showtimes.Add(showtime);

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task AddRangeAsync(
        IReadOnlyCollection<Showtime> showtimes,
        CancellationToken cancellationToken = default)
    {
        _dbContext.Showtimes.AddRange(showtimes);

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Showtime?> GetByIdAsync(Guid id)
    {
        return await _dbContext.Showtimes
            .AsNoTracking()
            .FirstOrDefaultAsync(showtime => showtime.Id == id);
    }

    public async Task<List<Showtime>> GetAllAsync()
    {
        return await _dbContext.Showtimes
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<bool> HasOverlappingShowtimeAsync(
        Guid roomId,
        DateTime startTime,
        DateTime endTime,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Showtimes
            .AsNoTracking()
            .AnyAsync(showtime =>
                showtime.RoomId == roomId &&
                showtime.StartTime < endTime &&
                showtime.EndTime > startTime,
                cancellationToken);
    }

    public async Task<IReadOnlyList<Showtime>> GetOverlappingAsync(
        Guid roomId,
        DateTime rangeStart,
        DateTime rangeEnd,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Showtimes
            .AsNoTracking()
            .Where(showtime =>
                showtime.RoomId == roomId &&
                showtime.StartTime < rangeEnd &&
                showtime.EndTime > rangeStart)
            .ToListAsync(cancellationToken);
    }

    public async Task<TResult> ExecuteInSerializableTransactionAsync<TResult>(
        Func<CancellationToken, Task<TResult>> action,
        CancellationToken cancellationToken = default)
    {
        await using var transaction =
            await _dbContext.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

        try
        {
            var result = await action(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            return result;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
