using CinemaBooking.Modules.Theater.Contracts;
using CinemaBooking.Modules.Theater.Domain;
using CinemaBooking.Modules.Theater.Infrastructure.Persistence;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.Modules.Theater.Application;

public class TheaterModule : ITheaterModule
{
    private readonly TheaterDbContext _dbContext;

    public TheaterModule(TheaterDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> CinemaExistsAsync(
        Guid cinemaId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Cinemas
            .AsNoTracking()
            .AnyAsync(
                cinema => cinema.Id == cinemaId,
                cancellationToken);
    }

    public async Task<CinemaInfo?> GetCinemaAsync(
        Guid cinemaId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Cinemas
            .AsNoTracking()
            .Where(cinema => cinema.Id == cinemaId)
            .Select(cinema => new CinemaInfo(
                cinema.Id,
                cinema.Name,
                cinema.Address,
                cinema.City,
                cinema.Description,
                cinema.IsActive))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CinemaInfo>> GetCinemasAsync(
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Cinemas
            .AsNoTracking()
            .OrderBy(cinema => cinema.City)
            .ThenBy(cinema => cinema.Name)
            .Select(cinema => new CinemaInfo(
                cinema.Id,
                cinema.Name,
                cinema.Address,
                cinema.City,
                cinema.Description,
                cinema.IsActive))
            .ToListAsync(cancellationToken);
    }

    public async Task<CinemaInfo> CreateCinemaAsync(
        string name,
        string address,
        string city,
        string? description,
        CancellationToken cancellationToken = default)
    {
        var cinema = new Cinema
        {
            Name = name.Trim(),
            Address = address.Trim(),
            City = city.Trim(),
            Description = description?.Trim(),
            IsActive = true
        };

        _dbContext.Cinemas.Add(cinema);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToInfo(cinema);
    }

    public async Task UpdateCinemaAsync(
        Guid cinemaId,
        string name,
        string address,
        string city,
        string? description,
        bool isActive,
        CancellationToken cancellationToken = default)
    {
        var cinema =
            await _dbContext.Cinemas
                .FirstOrDefaultAsync(
                    item => item.Id == cinemaId,
                    cancellationToken);

        if (cinema is null)
        {
            throw new NotFoundException("Cinema was not found.");
        }

        cinema.Name = name.Trim();
        cinema.Address = address.Trim();
        cinema.City = city.Trim();
        cinema.Description = description?.Trim();
        cinema.IsActive = isActive;

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<RoomInfo?> GetRoomAsync(
        Guid roomId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Rooms
            .AsNoTracking()
            .Where(room => room.Id == roomId)
            .Select(room => new RoomInfo(
                room.Id,
                room.CinemaId,
                room.Name))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<bool> RoomExistsAsync(
        Guid roomId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Rooms
            .AsNoTracking()
            .AnyAsync(
                room => room.Id == roomId,
                cancellationToken);
    }

    public async Task<bool> SeatBelongsToRoomAsync(
        Guid seatId,
        Guid roomId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Seats
            .AsNoTracking()
            .AnyAsync(
                seat =>
                    seat.Id == seatId &&
                    seat.RoomId == roomId,
                cancellationToken);
    }

    public async Task<IReadOnlyList<SeatInfo>> GetSeatsByRoomAsync(
        Guid roomId,
        CancellationToken cancellationToken = default)
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
            .ToListAsync(cancellationToken);
    }

    private static CinemaInfo ToInfo(Cinema cinema)
    {
        return new CinemaInfo(
            cinema.Id,
            cinema.Name,
            cinema.Address,
            cinema.City,
            cinema.Description,
            cinema.IsActive);
    }
}
