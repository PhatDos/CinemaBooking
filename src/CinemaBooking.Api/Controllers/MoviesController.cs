using CinemaBooking.Modules.Catalog.Application.Movies;
using CinemaBooking.Modules.Catalog.Contracts;
using CinemaBooking.Modules.Identity.Application.Roles;
using CinemaBooking.Modules.Scheduling.Contracts;
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

    public MoviesController(
        MovieService movieService,
        ICatalogModule catalogModule,
        ISchedulingModule schedulingModule)
    {
        _movieService = movieService;
        _catalogModule = catalogModule;
        _schedulingModule = schedulingModule;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var movies = await _movieService.GetAllAsync(
            User.IsInRole(AppRoles.Admin));

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
    public async Task<IActionResult> GetShowtimes(Guid movieId)
    {
        var movieExists =
            await _catalogModule.MovieExistsAsync(movieId);

        if (!movieExists)
        {
            return NotFound();
        }

        var showtimes =
            await _schedulingModule.GetShowtimesByMovieAsync(movieId);

        return Ok(showtimes);
    }

    [Authorize(Roles = AppRoles.Admin)]
    [HttpPost]
    public async Task<IActionResult> Create(CreateMovieRequest request)
    {
        var movie = await _movieService.CreateAsync(request);

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

        return Ok(result);
    }

    [Authorize(Roles = AppRoles.Admin)]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateMovieRequest request)
    {
        await _movieService.UpdateAsync(id, request);

        return NoContent();
    }
}
