namespace CinemaBooking.Modules.Catalog.Application.Movies;

public sealed record BulkCreateMoviesResult(
    int CreatedCount,
    IReadOnlyCollection<Guid> MovieIds);
