namespace CinemaBooking.Modules.Booking.Contracts;

public class BookingPaymentInfo
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public decimal TotalAmount { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime? ExpiresAt { get; set; }
}
