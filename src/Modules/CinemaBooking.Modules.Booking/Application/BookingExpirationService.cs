using CinemaBooking.Modules.Booking.Application.Interfaces;
using CinemaBooking.Modules.Booking.Domain;

namespace CinemaBooking.Modules.Booking.Application;

public class BookingExpirationService
{
    private readonly IBookingRepository _repository;

    public BookingExpirationService(IBookingRepository repository)
    {
        _repository = repository;
    }

    public async Task ExpireBookingsAsync()
    {
        var bookings =
            await _repository.GetExpiredPendingBookingsAsync(
                DateTime.UtcNow);

        foreach (var booking in bookings)
        {
            var seats = booking.Seats.ToList();

            _repository.RemoveSeats(seats);

            booking.Status = BookingStatus.Expired;
        }

        if (bookings.Count > 0)
        {
            await _repository.SaveChangesAsync();
        }
    }
}
