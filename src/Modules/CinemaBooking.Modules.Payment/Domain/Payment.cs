namespace CinemaBooking.Modules.Payment.Domain;

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid BookingId { get; set; }

    public Guid UserId { get; set; }

    public decimal Amount { get; set; }

    public PaymentStatus Status { get; set; } =
        PaymentStatus.Pending;

    public DateTime CreatedAt { get; set; } =
        DateTime.UtcNow;

    public DateTime? PaidAt { get; set; }
}
