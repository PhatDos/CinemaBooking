using CinemaBooking.Modules.Catalog.Domain;

namespace CinemaBooking.Modules.Catalog.Application.Interfaces;

public interface IMovieRepository
{
    Task<List<Movie>> GetAllAsync();

    Task<Movie?> GetByIdAsync(Guid id);

    Task AddAsync(Movie movie);
}
