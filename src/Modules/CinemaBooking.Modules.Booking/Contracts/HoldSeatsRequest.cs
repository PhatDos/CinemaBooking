using System.ComponentModel.DataAnnotations;

namespace CinemaBooking.Modules.Booking.Contracts;

public class HoldSeatsRequest
{
    [Required]
    [MinLength(1)]
    public List<Guid> SeatIds { get; set; } = [];
}
