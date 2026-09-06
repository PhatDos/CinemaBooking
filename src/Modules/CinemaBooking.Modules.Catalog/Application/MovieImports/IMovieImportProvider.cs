namespace CinemaBooking.Modules.Catalog.Application.MovieImports;

public interface IMovieImportProvider
{
    string Source { get; }

    Task<IReadOnlyList<ImportedMovieData>> FetchAsync(
        CancellationToken cancellationToken = default);
}
