using CinemaBooking.Modules.Catalog.Contracts;
using CinemaBooking.Modules.Catalog.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.Modules.Catalog.Application;

public class CatalogModule : ICatalogModule
{
    private readonly CatalogDbContext _dbContext;

    public CatalogModule(CatalogDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> MovieExistsAsync(Guid movieId)
    {
        return await _dbContext.Movies
            .AsNoTracking()
            .AnyAsync(movie => movie.Id == movieId);
    }

    public async Task<MovieInfo?> GetMovieAsync(
        Guid movieId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Movies
            .AsNoTracking()
            .Where(movie => movie.Id == movieId)
            .Select(movie => new MovieInfo(
                movie.Id,
                movie.Title,
                movie.Description,
                movie.DurationMinutes,
                movie.ReleaseDate,
                movie.PosterUrl,
                movie.TrailerUrl,
                movie.Genre,
                movie.IsActive))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
