using CinemaBooking.Modules.Theater.Contracts;
using CinemaBooking.Modules.Theater.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.Modules.Theater.Application;

public class TheaterModule : ITheaterModule
{
    private readonly TheaterDbContext _dbContext;

    public TheaterModule(TheaterDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> RoomExistsAsync(Guid roomId)
    {
        return await _dbContext.Rooms
            .AsNoTracking()
            .AnyAsync(room => room.Id == roomId);
    }

    public async Task<bool> SeatBelongsToRoomAsync(
        Guid seatId,
        Guid roomId)
    {
        return await _dbContext.Seats
            .AsNoTracking()
            .AnyAsync(seat =>
                seat.Id == seatId &&
                seat.RoomId == roomId);
    }

    public async Task<IReadOnlyList<SeatInfo>> GetSeatsByRoomAsync(
        Guid roomId)
    {
        return await _dbContext.Seats
            .AsNoTracking()
            .Where(seat => seat.RoomId == roomId)
            .OrderBy(seat => seat.Row)
            .ThenBy(seat => seat.Number)
            .Select(seat => new SeatInfo
            {
                Id = seat.Id,
                Row = seat.Row,
                Number = seat.Number
            })
            .ToListAsync();
    }
}
