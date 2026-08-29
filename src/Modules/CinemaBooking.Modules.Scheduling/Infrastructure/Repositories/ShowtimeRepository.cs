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

    public async Task AddAsync(Showtime showtime)
    {
        _dbContext.Showtimes.Add(showtime);

        await _dbContext.SaveChangesAsync();
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
        DateTime endTime)
    {
        return await _dbContext.Showtimes
            .AsNoTracking()
            .AnyAsync(showtime =>
                showtime.RoomId == roomId &&
                showtime.StartTime < endTime &&
                showtime.EndTime > startTime);
    }
}
