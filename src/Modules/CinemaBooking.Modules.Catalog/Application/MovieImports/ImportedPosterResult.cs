namespace CinemaBooking.Modules.Catalog.Application.MovieImports;

public sealed record ImportedPosterResult(
    string PosterUrl,
    string? PosterPublicId);
