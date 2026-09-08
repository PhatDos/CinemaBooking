using CinemaBooking.Api.Infrastructure.Caching;
using CinemaBooking.Modules.Catalog.Application.Genres;
using CinemaBooking.Modules.Identity.Application.Roles;
using CinemaBooking.SharedKernel.Caching;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/genres")]
public class GenresController : ControllerBase
{
    private readonly GenreService _genreService;
    private readonly IAppCache _cache;
    private readonly AppCacheKeys _cacheKeys;

    public GenresController(
        GenreService genreService,
        IAppCache cache,
        AppCacheKeys cacheKeys)
    {
        _genreService = genreService;
        _cache = cache;
        _cacheKeys = cacheKeys;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        CancellationToken cancellationToken)
    {
        var genres =
            await _cache.GetOrCreateAsync(
                _cacheKeys.GenresPublicList,
                [AppCacheTags.CatalogGenres],
                TimeSpan.FromHours(2),
                _genreService.GetAllAsync,
                cancellationToken);

        return Ok(genres);
    }

    [Authorize(Roles = AppRoles.Admin)]
    [HttpPost]
    public async Task<IActionResult> Create(
        CreateGenreRequest request,
        CancellationToken cancellationToken)
    {
        var genre =
            await _genreService.CreateAsync(
                request,
                cancellationToken);
        await _cache.InvalidateTagsAsync(
            [
                AppCacheTags.CatalogGenres,
                AppCacheTags.CatalogMovies
            ],
            cancellationToken);

        return CreatedAtAction(
            nameof(GetAll),
            new { id = genre.Id },
            genre);
    }

    [Authorize(Roles = AppRoles.Admin)]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateGenreRequest request,
        CancellationToken cancellationToken)
    {
        await _genreService.UpdateAsync(
            id,
            request,
            cancellationToken);
        await _cache.InvalidateTagsAsync(
            [
                AppCacheTags.CatalogGenres,
                AppCacheTags.CatalogMovies
            ],
            cancellationToken);

        return NoContent();
    }

    [Authorize(Roles = AppRoles.Admin)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        await _genreService.DeleteAsync(
            id,
            cancellationToken);
        await _cache.InvalidateTagsAsync(
            [
                AppCacheTags.CatalogGenres,
                AppCacheTags.CatalogMovies
            ],
            cancellationToken);

        return NoContent();
    }
}
