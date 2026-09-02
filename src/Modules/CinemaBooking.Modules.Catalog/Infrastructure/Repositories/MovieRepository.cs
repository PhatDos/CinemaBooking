using CinemaBooking.Modules.Catalog.Application.Interfaces;
using CinemaBooking.Modules.Catalog.Domain;
using CinemaBooking.Modules.Catalog.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.Modules.Catalog.Infrastructure.Repositories;

public class MovieRepository : IMovieRepository
{
    private readonly CatalogDbContext _dbContext;

    public MovieRepository(CatalogDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Movie>> GetAllAsync()
    {
        return await _dbContext.Movies
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Movie?> GetByIdAsync(Guid id)
    {
        return await _dbContext.Movies
            .AsNoTracking()
            .FirstOrDefaultAsync(movie => movie.Id == id);
    }

    public async Task<Movie?> GetByIdForUpdateAsync(Guid id)
    {
        return await _dbContext.Movies
            .FirstOrDefaultAsync(movie => movie.Id == id);
    }

    public async Task AddAsync(Movie movie)
    {
        _dbContext.Movies.Add(movie);

        await _dbContext.SaveChangesAsync();
    }

    public async Task AddRangeAsync(
        IReadOnlyCollection<Movie> movies,
        CancellationToken cancellationToken = default)
    {
        _dbContext.Movies.AddRange(movies);

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
