using CinemaBooking.Modules.Booking.Domain;
using CinemaBooking.Modules.Booking.Application.SeatAvailability;
using BookingEntity = CinemaBooking.Modules.Booking.Domain.Booking;

namespace CinemaBooking.Modules.Booking.Application.Interfaces;

public interface IBookingRepository
{
    Task AddAsync(BookingEntity booking);

    Task<BookingEntity?> GetByIdAsync(Guid id);

    Task<BookingEntity?> GetByHoldIdAsync(Guid holdId);

    Task<BookingEntity?> GetForUpdateAsync(Guid id);

    Task<List<BookingEntity>> GetAllAsync();

    Task<List<BookingEntity>> GetByUserIdAsync(Guid userId);

    Task<List<BookingEntity>> GetExpiredPendingBookingsAsync(
        DateTime utcNow);

    Task<bool> IsSeatBookedAsync(
        Guid showtimeId,
        Guid seatId);

    Task<List<SeatBookingStatusInfo>> GetSeatStatusesAsync(
        Guid showtimeId);

    Task SaveChangesAsync();
}
