namespace CinemaBooking.Modules.Booking.Contracts;

public class HoldSeatsResult
{
    public Guid HoldId { get; set; }

    public Guid ShowtimeId { get; set; }

    public IReadOnlyCollection<Guid> SeatIds { get; set; } = [];

    public DateTimeOffset ExpiresAt { get; set; }
}
