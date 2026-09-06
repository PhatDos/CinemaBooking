using CinemaBooking.Modules.Catalog.Application.Genres;
using CinemaBooking.Modules.Identity.Application.Roles;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/genres")]
public class GenresController : ControllerBase
{
    private readonly GenreService _genreService;

    public GenresController(GenreService genreService)
    {
        _genreService = genreService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        CancellationToken cancellationToken)
    {
        var genres =
            await _genreService.GetAllAsync(cancellationToken);

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

        return NoContent();
    }
}
