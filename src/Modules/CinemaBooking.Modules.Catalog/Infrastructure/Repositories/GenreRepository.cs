using CinemaBooking.Modules.Catalog.Application.Interfaces;
using CinemaBooking.Modules.Catalog.Domain;
using CinemaBooking.Modules.Catalog.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.Modules.Catalog.Infrastructure.Repositories;

public class GenreRepository : IGenreRepository
{
    private readonly CatalogDbContext _dbContext;

    public GenreRepository(CatalogDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Genre>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Genres
            .AsNoTracking()
            .OrderBy(genre => genre.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Genre?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Genres
            .AsNoTracking()
            .FirstOrDefaultAsync(
                genre => genre.Id == id,
                cancellationToken);
    }

    public async Task<Genre?> GetBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Genres
            .AsNoTracking()
            .FirstOrDefaultAsync(
                genre => genre.Slug == slug,
                cancellationToken);
    }

    public async Task<Genre?> GetByIdForUpdateAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Genres
            .FirstOrDefaultAsync(
                genre => genre.Id == id,
                cancellationToken);
    }

    public async Task<bool> IsUsedByMovieAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Movies
            .AnyAsync(
                movie => movie.GenreId == id,
                cancellationToken) ||
            await _dbContext.MovieGenres
                .AnyAsync(
                    movieGenre => movieGenre.GenreId == id,
                    cancellationToken);
    }

    public async Task AddAsync(
        Genre genre,
        CancellationToken cancellationToken = default)
    {
        await _dbContext.Genres.AddAsync(
            genre,
            cancellationToken);
    }

    public void Remove(Genre genre)
    {
        _dbContext.Genres.Remove(genre);
    }

    public async Task SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
