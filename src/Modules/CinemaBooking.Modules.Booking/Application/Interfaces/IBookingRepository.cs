using CinemaBooking.Modules.Booking.Domain;
using BookingEntity = CinemaBooking.Modules.Booking.Domain.Booking;

namespace CinemaBooking.Modules.Booking.Application.Interfaces;

public interface IBookingRepository
{
    Task AddAsync(BookingEntity booking);

    Task<BookingEntity?> GetByIdAsync(Guid id);

    Task<BookingEntity?> GetForUpdateAsync(Guid id);

    Task<List<BookingEntity>> GetAllAsync();

    Task<List<BookingEntity>> GetByUserIdAsync(Guid userId);

    Task<List<BookingEntity>> GetExpiredPendingBookingsAsync(
        DateTime utcNow);

    Task<bool> IsSeatBookedAsync(
        Guid showtimeId,
        Guid seatId);

    Task<HashSet<Guid>> GetBookedSeatIdsAsync(Guid showtimeId);

    void RemoveSeats(IEnumerable<BookingSeat> seats);

    Task SaveChangesAsync();
}
