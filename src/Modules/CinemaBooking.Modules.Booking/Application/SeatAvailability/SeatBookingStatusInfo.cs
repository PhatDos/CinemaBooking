using CinemaBooking.Modules.Booking.Domain;

namespace CinemaBooking.Modules.Booking.Application.SeatAvailability;

public class SeatBookingStatusInfo
{
    public Guid SeatId { get; set; }

    public BookingStatus BookingStatus { get; set; }
}
