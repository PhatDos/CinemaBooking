namespace CinemaBooking.Modules.Booking.Application.SeatHolds;

public sealed record SeatHoldMetadata(
    Guid HoldId,
    Guid UserId,
    Guid ShowtimeId,
    IReadOnlyCollection<Guid> SeatIds,
    DateTimeOffset ExpiresAt);
