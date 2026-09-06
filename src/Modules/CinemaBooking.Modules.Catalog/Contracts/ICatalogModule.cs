namespace CinemaBooking.Modules.Catalog.Contracts;

public interface ICatalogModule
{
    Task<bool> MovieExistsAsync(Guid movieId);

    Task<MovieInfo?> GetMovieAsync(
        Guid movieId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MovieInfo>> GetMoviesByIdsAsync(
        IReadOnlyCollection<Guid> movieIds,
        CancellationToken cancellationToken = default);
}
