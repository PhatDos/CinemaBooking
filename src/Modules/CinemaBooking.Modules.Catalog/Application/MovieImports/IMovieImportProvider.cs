namespace CinemaBooking.Modules.Catalog.Application.MovieImports;

public interface IMovieImportProvider
{
    string Source { get; }

    Task<IReadOnlyList<ImportedMovieListing>> DiscoverAsync(
        CancellationToken cancellationToken = default);

    Task<ImportedMovieData?> FetchDetailAsync(
        string sourceUrl,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ImportedMovieData>> FetchAsync(
        CancellationToken cancellationToken = default);
}
