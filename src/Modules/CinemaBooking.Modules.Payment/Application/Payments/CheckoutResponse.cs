namespace CinemaBooking.Modules.Payment.Application.Payments;

public sealed class CheckoutResponse
{
    public Guid HoldId { get; set; }

    public Guid UserId { get; set; }

    public Guid ShowtimeId { get; set; }

    public IReadOnlyCollection<Guid> SeatIds { get; set; } = [];

    public decimal Amount { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }

    public string Status { get; set; } = string.Empty;

    public PaymentResponse? Payment { get; set; }

    public string? CheckoutUrl { get; set; }
}
