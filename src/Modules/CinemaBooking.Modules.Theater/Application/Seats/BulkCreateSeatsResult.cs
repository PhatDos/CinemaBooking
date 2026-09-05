namespace CinemaBooking.Modules.Theater.Application.Seats;

public sealed record BulkCreateSeatsResult(
    int CreatedCount,
    IReadOnlyCollection<Guid> SeatIds);
