namespace CinemaBooking.Modules.Payment.Application.Payments;

public class PaymentResponse
{
    public Guid Id { get; set; }

    public Guid BookingId { get; set; }

    public long? OrderCode { get; set; }

    public decimal Amount { get; set; }

    public string Status { get; set; } = string.Empty;

    public string Provider { get; set; } = string.Empty;

    public string? PaymentLinkId { get; set; }

    public string? CheckoutUrl { get; set; }

    public string? QrCode { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? PaidAt { get; set; }
}
