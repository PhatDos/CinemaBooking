namespace CinemaBooking.Modules.Catalog.Contracts;

public interface ICatalogModule
{
    Task<bool> MovieExistsAsync(Guid movieId);

    Task<MovieInfo?> GetMovieAsync(
        Guid movieId,
        CancellationToken cancellationToken = default);
}
