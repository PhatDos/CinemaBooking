namespace CinemaBooking.Modules.Catalog.Application.MovieImports;

public sealed class PassThroughMoviePosterImporter : IMoviePosterImporter
{
    public Task<ImportedPosterResult?> ImportAsync(
        string posterUrl,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult<ImportedPosterResult?>(
            new ImportedPosterResult(
                posterUrl,
                null));
    }
}
