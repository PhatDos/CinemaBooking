namespace CinemaBooking.Modules.Booking.Domain;

public class BookingSeat
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid BookingId { get; set; }

    public Guid ShowtimeId { get; set; }

    public Guid SeatId { get; set; }

    public decimal Price { get; set; }

    public DateTime? ReleasedAt { get; set; }

    public Booking Booking { get; set; } = null!;
}
