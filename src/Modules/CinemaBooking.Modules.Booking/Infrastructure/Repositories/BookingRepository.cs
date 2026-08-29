using CinemaBooking.Modules.Booking.Application.Interfaces;
using CinemaBooking.Modules.Booking.Domain;
using CinemaBooking.Modules.Booking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using BookingEntity = CinemaBooking.Modules.Booking.Domain.Booking;

namespace CinemaBooking.Modules.Booking.Infrastructure.Repositories;

public class BookingRepository : IBookingRepository
{
    private readonly BookingDbContext _dbContext;

    public BookingRepository(BookingDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(BookingEntity booking)
    {
        _dbContext.Bookings.Add(booking);

        await _dbContext.SaveChangesAsync();
    }

    public async Task<BookingEntity?> GetByIdAsync(Guid id)
    {
        return await _dbContext.Bookings
            .AsNoTracking()
            .Include(booking => booking.Seats)
            .FirstOrDefaultAsync(booking => booking.Id == id);
    }

    public async Task<BookingEntity?> GetForUpdateAsync(Guid id)
    {
        return await _dbContext.Bookings
            .Include(booking => booking.Seats)
            .FirstOrDefaultAsync(booking => booking.Id == id);
    }

    public async Task<List<BookingEntity>> GetAllAsync()
    {
        return await _dbContext.Bookings
            .AsNoTracking()
            .Include(booking => booking.Seats)
            .ToListAsync();
    }

    public async Task<List<BookingEntity>> GetByUserIdAsync(Guid userId)
    {
        return await _dbContext.Bookings
            .AsNoTracking()
            .Include(booking => booking.Seats)
            .Where(booking => booking.UserId == userId)
            .OrderByDescending(booking => booking.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> IsSeatBookedAsync(
        Guid showtimeId,
        Guid seatId)
    {
        return await _dbContext.BookingSeats
            .AsNoTracking()
            .AnyAsync(seat =>
                seat.ShowtimeId == showtimeId &&
                seat.SeatId == seatId);
    }

    public async Task<HashSet<Guid>> GetBookedSeatIdsAsync(
        Guid showtimeId)
    {
        var seatIds = await _dbContext.BookingSeats
            .AsNoTracking()
            .Where(seat => seat.ShowtimeId == showtimeId)
            .Select(seat => seat.SeatId)
            .ToListAsync();

        return seatIds.ToHashSet();
    }

    public void RemoveSeats(IEnumerable<BookingSeat> seats)
    {
        _dbContext.BookingSeats.RemoveRange(seats);
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
