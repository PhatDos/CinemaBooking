using CinemaBooking.Modules.Catalog.Domain;

namespace CinemaBooking.Modules.Catalog.Application.Interfaces;

public interface IGenreRepository
{
    Task<List<Genre>> GetAllAsync(
        CancellationToken cancellationToken = default);

    Task<Genre?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<Genre?> GetBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default);

    Task<Genre?> GetByIdForUpdateAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<bool> IsUsedByMovieAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task AddAsync(
        Genre genre,
        CancellationToken cancellationToken = default);

    void Remove(Genre genre);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
