using CinemaBooking.Modules.Booking.Domain;

namespace CinemaBooking.Modules.Booking.Application.Bookings;

public class BookingResponse
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid ShowtimeId { get; set; }

    public BookingStatus Status { get; set; }

    public decimal TotalAmount { get; set; }

    public List<Guid> SeatIds { get; set; } = [];

    public List<BookingSeatResponse> Seats { get; set; } = [];

    public DateTime CreatedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }
}
