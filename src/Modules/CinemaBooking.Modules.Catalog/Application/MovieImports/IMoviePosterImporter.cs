namespace CinemaBooking.Modules.Catalog.Application.MovieImports;

public interface IMoviePosterImporter
{
    Task<ImportedPosterResult?> ImportAsync(
        string posterUrl,
        CancellationToken cancellationToken = default);
}
