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

    public async Task<ShowtimeInfo?> GetShowtimeAsync(Guid showtimeId)
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
            .FirstOrDefaultAsync();
    }
}
