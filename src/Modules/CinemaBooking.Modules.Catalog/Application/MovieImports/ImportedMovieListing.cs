namespace CinemaBooking.Modules.Catalog.Application.MovieImports;

public sealed record ImportedMovieListing(
    string Source,
    string SourceUrl,
    string Title,
    IReadOnlyList<string> GenreNames,
    decimal? Popularity,
    long? ReleaseTimestamp);
