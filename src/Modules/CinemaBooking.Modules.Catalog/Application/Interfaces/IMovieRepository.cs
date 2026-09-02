using CinemaBooking.Modules.Catalog.Domain;

namespace CinemaBooking.Modules.Catalog.Application.Interfaces;

public interface IMovieRepository
{
    Task<List<Movie>> GetAllAsync();

    Task<Movie?> GetByIdAsync(Guid id);

    Task<Movie?> GetByIdForUpdateAsync(Guid id);

    Task AddAsync(Movie movie);

    Task AddRangeAsync(
        IReadOnlyCollection<Movie> movies,
        CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
