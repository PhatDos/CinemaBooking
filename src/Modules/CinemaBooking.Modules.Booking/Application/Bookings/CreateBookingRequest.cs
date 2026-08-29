using System.ComponentModel.DataAnnotations;

namespace CinemaBooking.Modules.Booking.Application.Bookings;

public class CreateBookingRequest
{
    public Guid ShowtimeId { get; set; }

    [Required]
    [MinLength(1)]
    public List<Guid> SeatIds { get; set; } = [];
}
