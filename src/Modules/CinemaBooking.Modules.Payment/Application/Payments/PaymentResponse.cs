namespace CinemaBooking.Modules.Payment.Application.Payments;

public class PaymentResponse
{
    public Guid Id { get; set; }

    public Guid? BookingId { get; set; }

    public Guid? HoldId { get; set; }

    public Guid? ShowtimeId { get; set; }

    public long? OrderCode { get; set; }

    public decimal Amount { get; set; }

    public string Status { get; set; } = string.Empty;

    public string FulfillmentStatus { get; set; } = string.Empty;

    public string? FulfillmentLastError { get; set; }

    public string Provider { get; set; } = string.Empty;

    public string? PaymentLinkId { get; set; }

    public string? CheckoutUrl { get; set; }

    public string? QrCode { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public DateTime? PaidAt { get; set; }

    public DateTime? FulfilledAt { get; set; }

    public DateTime? FulfillmentFailedAt { get; set; }
}
