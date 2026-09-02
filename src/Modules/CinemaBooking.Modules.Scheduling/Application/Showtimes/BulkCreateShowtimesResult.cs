namespace CinemaBooking.Modules.Scheduling.Application.Showtimes;

public sealed record BulkCreateShowtimesResult(
    int CreatedCount,
    IReadOnlyCollection<Guid> ShowtimeIds);
