namespace CinemaBooking.Modules.Booking.Contracts;

public class BookingPaymentInfo
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid ShowtimeId { get; set; }

    public decimal TotalAmount { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime? ExpiresAt { get; set; }

    public IReadOnlyCollection<BookingPaymentSeatInfo> Seats { get; set; } =
        [];
}

public sealed record BookingPaymentSeatInfo(
    Guid SeatId,
    decimal Price);
