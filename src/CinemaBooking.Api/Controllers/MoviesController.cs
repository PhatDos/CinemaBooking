using CinemaBooking.Api.Infrastructure.Caching;
using CinemaBooking.Modules.Catalog.Application.Movies;
using CinemaBooking.Modules.Catalog.Contracts;
using CinemaBooking.Modules.Identity.Application.Roles;
using CinemaBooking.Modules.Scheduling.Contracts;
using CinemaBooking.SharedKernel.Caching;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/movies")]
public class MoviesController : ControllerBase
{
    private readonly MovieService _movieService;
    private readonly ICatalogModule _catalogModule;
    private readonly ISchedulingModule _schedulingModule;
    private readonly IAppCache _cache;
    private readonly AppCacheKeys _cacheKeys;

    public MoviesController(
        MovieService movieService,
        ICatalogModule catalogModule,
        ISchedulingModule schedulingModule,
        IAppCache cache,
        AppCacheKeys cacheKeys)
    {
        _movieService = movieService;
        _catalogModule = catalogModule;
        _schedulingModule = schedulingModule;
        _cache = cache;
        _cacheKeys = cacheKeys;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        CancellationToken cancellationToken)
    {
        var includeInactive =
            User.IsInRole(AppRoles.Admin);
        var cacheKey = includeInactive
            ? _cacheKeys.MoviesAdminList
            : _cacheKeys.MoviesPublicList;

        var movies =
            await _cache.GetOrCreateAsync(
                cacheKey,
                [AppCacheTags.CatalogMovies],
                includeInactive
                    ? TimeSpan.FromMinutes(1)
                    : TimeSpan.FromMinutes(10),
                _ => _movieService.GetAllAsync(includeInactive),
                cancellationToken);

        return Ok(movies);
    }

    [HttpGet("now-showing")]
    public async Task<IActionResult> GetNowShowing(
        CancellationToken cancellationToken)
    {
        var movies =
            await _cache.GetOrCreateAsync(
                _cacheKeys.NowShowing,
                [
                    AppCacheTags.CatalogMovies,
                    AppCacheTags.SchedulingShowtimes
                ],
                TimeSpan.FromMinutes(30),
                async token =>
                {
                    var upcomingMovieIds =
                        await _schedulingModule.GetUpcomingMovieIdsAsync(
                            token);

                    var movieIds =
                        upcomingMovieIds.ToHashSet();

                    return (await _movieService.GetAllAsync())
                        .Where(movie => movieIds.Contains(movie.Id))
                        .ToList();
                },
                cancellationToken);

        return Ok(movies);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var movie = await _movieService.GetByIdAsync(id);

        if (movie is null)
        {
            return NotFound();
        }

        return Ok(movie);
    }

    [HttpGet("{movieId:guid}/showtimes")]
    public async Task<IActionResult> GetShowtimes(
        Guid movieId,
        CancellationToken cancellationToken)
    {
        var movieExists =
            await _catalogModule.MovieExistsAsync(movieId);

        if (!movieExists)
        {
            return NotFound();
        }

        var showtimes =
            await _schedulingModule.GetShowtimesByMovieAsync(
                movieId,
                cancellationToken);

        return Ok(showtimes);
    }

    [Authorize(Roles = AppRoles.Admin)]
    [HttpPost]
    public async Task<IActionResult> Create(CreateMovieRequest request)
    {
        var movie = await _movieService.CreateAsync(request);
        await _cache.InvalidateTagsAsync(
            [AppCacheTags.CatalogMovies]);

        return CreatedAtAction(
            nameof(GetById),
            new { id = movie.Id },
            movie);
    }

    [Authorize(Roles = AppRoles.Admin)]
    [HttpPost("bulk")]
    public async Task<IActionResult> BulkCreate(
        BulkCreateMoviesRequest request,
        CancellationToken cancellationToken)
    {
        var result =
            await _movieService.BulkCreateAsync(
                request.Movies,
                cancellationToken);
        await _cache.InvalidateTagsAsync(
            [AppCacheTags.CatalogMovies],
            cancellationToken);

        return Ok(result);
    }

    [Authorize(Roles = AppRoles.Admin)]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateMovieRequest request,
        CancellationToken cancellationToken)
    {
        await _movieService.UpdateAsync(id, request);
        await _cache.InvalidateTagsAsync(
            [AppCacheTags.CatalogMovies],
            cancellationToken);

        return NoContent();
    }
}
