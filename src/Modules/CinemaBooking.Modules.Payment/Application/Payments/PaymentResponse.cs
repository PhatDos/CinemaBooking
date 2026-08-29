namespace CinemaBooking.Modules.Payment.Application.Payments;

public class PaymentResponse
{
    public Guid Id { get; set; }

    public Guid BookingId { get; set; }

    public decimal Amount { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime? PaidAt { get; set; }
}
