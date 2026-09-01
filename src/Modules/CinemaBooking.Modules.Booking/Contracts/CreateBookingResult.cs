namespace CinemaBooking.Modules.Booking.Contracts;

public class CreateBookingResult
{
    public Guid BookingId { get; set; }

    public Guid HoldId { get; set; }

    public Guid UserId { get; set; }

    public Guid ShowtimeId { get; set; }

    public string Status { get; set; } = string.Empty;

    public decimal TotalAmount { get; set; }

    public IReadOnlyCollection<Guid> SeatIds { get; set; } = [];

    public DateTime CreatedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }
}
