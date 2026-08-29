using CinemaBooking.Modules.Booking.Application.Interfaces;
using CinemaBooking.Modules.Booking.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CinemaBooking.Modules.Booking.Application;

public class BookingExpirationService
{
    private readonly IBookingRepository _repository;
    private readonly ILogger<BookingExpirationService> _logger;

    public BookingExpirationService(
        IBookingRepository repository,
        ILogger<BookingExpirationService> logger)
    {
        _repository = repository;
        _logger = logger;
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
            try
            {
                await _repository.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogInformation(
                    ex,
                    "Skipped expiring bookings because one or more booking states changed.");
            }
        }
    }
}
