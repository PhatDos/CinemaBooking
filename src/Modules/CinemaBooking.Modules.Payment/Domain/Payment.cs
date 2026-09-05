namespace CinemaBooking.Modules.Payment.Domain;

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid BookingId { get; set; }

    public Guid UserId { get; set; }

    public long? OrderCode { get; set; }

    public decimal Amount { get; set; }

    public PaymentStatus Status { get; set; } =
        PaymentStatus.Pending;

    public PaymentFulfillmentStatus FulfillmentStatus { get; set; } =
        PaymentFulfillmentStatus.Pending;

    public string Provider { get; set; } = "PayOS";

    public string? PaymentLinkId { get; set; }

    public string? ProviderTransactionId { get; set; }

    public string? CheckoutUrl { get; set; }

    public string? QrCode { get; set; }

    public DateTime CreatedAt { get; set; } =
        DateTime.UtcNow;

    public DateTime? PaidAt { get; set; }

    public DateTime? FulfilledAt { get; set; }

    public DateTime? FulfillmentFailedAt { get; set; }

    public string? FulfillmentLastError { get; set; }
}
