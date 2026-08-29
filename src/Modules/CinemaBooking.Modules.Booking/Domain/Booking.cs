namespace CinemaBooking.Modules.Booking.Domain;

public class Booking
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public Guid ShowtimeId { get; set; }

    public BookingStatus Status { get; set; } = BookingStatus.Pending;

    public decimal TotalAmount { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ExpiresAt { get; set; }

    public ICollection<BookingSeat> Seats { get; set; } = new List<BookingSeat>();
}
