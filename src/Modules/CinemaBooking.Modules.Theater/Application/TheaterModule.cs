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
                cinema.IsActive,
                cinema.ProvinceCode,
                cinema.ProvinceName,
                cinema.WardCode,
                cinema.WardName,
                cinema.AddressLine))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CinemaInfo>> GetCinemasAsync(
        string? provinceCode = null,
        string? wardCode = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Cinemas
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(provinceCode))
        {
            query = query.Where(cinema =>
                cinema.ProvinceCode == provinceCode.Trim());
        }

        if (!string.IsNullOrWhiteSpace(wardCode))
        {
            query = query.Where(cinema =>
                cinema.WardCode == wardCode.Trim());
        }

        return await query
            .OrderBy(cinema => cinema.City)
            .ThenBy(cinema => cinema.Name)
            .Select(cinema => new CinemaInfo(
                cinema.Id,
                cinema.Name,
                cinema.Address,
                cinema.City,
                cinema.Description,
                cinema.IsActive,
                cinema.ProvinceCode,
                cinema.ProvinceName,
                cinema.WardCode,
                cinema.WardName,
                cinema.AddressLine))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CinemaInfo>> GetCinemasByIdsAsync(
        IReadOnlyCollection<Guid> cinemaIds,
        CancellationToken cancellationToken = default)
    {
        if (cinemaIds.Count == 0)
        {
            return [];
        }

        return await _dbContext.Cinemas
            .AsNoTracking()
            .Where(cinema => cinemaIds.Contains(cinema.Id))
            .OrderBy(cinema => cinema.City)
            .ThenBy(cinema => cinema.Name)
            .Select(cinema => new CinemaInfo(
                cinema.Id,
                cinema.Name,
                cinema.Address,
                cinema.City,
                cinema.Description,
                cinema.IsActive,
                cinema.ProvinceCode,
                cinema.ProvinceName,
                cinema.WardCode,
                cinema.WardName,
                cinema.AddressLine))
            .ToListAsync(cancellationToken);
    }

    public async Task<CinemaInfo> CreateCinemaAsync(
        string name,
        string address,
        string city,
        string? description,
        string? provinceCode = null,
        string? provinceName = null,
        string? wardCode = null,
        string? wardName = null,
        string? addressLine = null,
        CancellationToken cancellationToken = default)
    {
        var normalizedAddressLine =
            NormalizeOptional(addressLine) ?? address.Trim();
        var normalizedProvinceName =
            NormalizeOptional(provinceName) ?? city.Trim();

        var cinema = new Cinema
        {
            Name = name.Trim(),
            Address = normalizedAddressLine,
            City = normalizedProvinceName,
            ProvinceCode = NormalizeOptional(provinceCode),
            ProvinceName = normalizedProvinceName,
            WardCode = NormalizeOptional(wardCode),
            WardName = NormalizeOptional(wardName),
            AddressLine = normalizedAddressLine,
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
        string? provinceCode = null,
        string? provinceName = null,
        string? wardCode = null,
        string? wardName = null,
        string? addressLine = null,
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

        var normalizedAddressLine =
            NormalizeOptional(addressLine) ?? address.Trim();
        var normalizedProvinceName =
            NormalizeOptional(provinceName) ?? city.Trim();

        cinema.Name = name.Trim();
        cinema.Address = normalizedAddressLine;
        cinema.City = normalizedProvinceName;
        cinema.ProvinceCode = NormalizeOptional(provinceCode);
        cinema.ProvinceName = normalizedProvinceName;
        cinema.WardCode = NormalizeOptional(wardCode);
        cinema.WardName = NormalizeOptional(wardName);
        cinema.AddressLine = normalizedAddressLine;
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
                room.Name,
                room.IsActive))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<RoomInfo>> GetRoomsByCinemaAsync(
        Guid cinemaId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Rooms
            .AsNoTracking()
            .Where(room => room.CinemaId == cinemaId)
            .OrderBy(room => room.Name)
            .Select(room => new RoomInfo(
                room.Id,
                room.CinemaId,
                room.Name,
                room.IsActive))
            .ToListAsync(cancellationToken);
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
                Number = seat.Number,
                Type = seat.Type.ToString()
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
            cinema.IsActive,
            cinema.ProvinceCode,
            cinema.ProvinceName,
            cinema.WardCode,
            cinema.WardName,
            cinema.AddressLine);
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}
