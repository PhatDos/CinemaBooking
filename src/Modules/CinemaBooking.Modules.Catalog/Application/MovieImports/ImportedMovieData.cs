namespace CinemaBooking.Modules.Catalog.Application.MovieImports;

public sealed record ImportedMovieData(
    string Source,
    string SourceUrl,
    string Title,
    string Description,
    int? DurationMinutes,
    DateTime? ReleaseDate,
    string? PosterUrl,
    string? TrailerUrl,
    IReadOnlyList<string> GenreNames,
    string ContentHash);
