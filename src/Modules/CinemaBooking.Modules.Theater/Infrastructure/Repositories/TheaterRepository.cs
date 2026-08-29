using CinemaBooking.Modules.Theater.Application.Interfaces;
using CinemaBooking.Modules.Theater.Domain;
using CinemaBooking.Modules.Theater.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.Modules.Theater.Infrastructure.Repositories;

public class TheaterRepository : ITheaterRepository
{
    private readonly TheaterDbContext _dbContext;

    public TheaterRepository(TheaterDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Cinema>> GetAllCinemasAsync()
    {
        return await _dbContext.Cinemas
            .AsNoTracking()
            .Include(cinema => cinema.Rooms)
                .ThenInclude(room => room.Seats)
            .AsSplitQuery()
            .ToListAsync();
    }

    public async Task<Cinema?> GetCinemaByIdAsync(Guid id)
    {
        return await _dbContext.Cinemas
            .AsNoTracking()
            .Include(cinema => cinema.Rooms)
                .ThenInclude(room => room.Seats)
            .AsSplitQuery()
            .FirstOrDefaultAsync(cinema => cinema.Id == id);
    }

    public async Task<List<Room>> GetAllRoomsAsync()
    {
        return await _dbContext.Rooms
            .AsNoTracking()
            .Include(room => room.Seats)
            .AsSplitQuery()
            .ToListAsync();
    }

    public async Task<Room?> GetRoomByIdAsync(Guid id)
    {
        return await _dbContext.Rooms
            .FirstOrDefaultAsync(room => room.Id == id);
    }

    public async Task<List<Seat>> GetAllSeatsAsync()
    {
        return await _dbContext.Seats
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task AddCinemaAsync(Cinema cinema)
    {
        _dbContext.Cinemas.Add(cinema);

        await _dbContext.SaveChangesAsync();
    }

    public async Task AddRoomAsync(Room room)
    {
        _dbContext.Rooms.Add(room);

        await _dbContext.SaveChangesAsync();
    }

    public async Task AddSeatAsync(Seat seat)
    {
        _dbContext.Seats.Add(seat);

        await _dbContext.SaveChangesAsync();
    }
}
