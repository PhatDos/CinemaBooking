namespace CinemaBooking.Modules.Booking.Contracts;

public sealed class HoldPaymentInfo
{
    public Guid HoldId { get; set; }

    public Guid UserId { get; set; }

    public Guid ShowtimeId { get; set; }

    public decimal TotalAmount { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }

    public IReadOnlyCollection<HoldPaymentSeatInfo> Seats { get; set; } = [];
}

public sealed record HoldPaymentSeatInfo(
    Guid SeatId,
    decimal Price);
