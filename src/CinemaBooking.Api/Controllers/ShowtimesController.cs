using CinemaBooking.Modules.Scheduling.Application.Showtimes;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/showtimes")]
public class ShowtimesController : ControllerBase
{
    private readonly ShowtimeService _showtimeService;

    public ShowtimesController(
        ShowtimeService showtimeService)
    {
        _showtimeService = showtimeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var showtimes =
            await _showtimeService.GetAllAsync();

        return Ok(showtimes);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var showtime =
            await _showtimeService.GetByIdAsync(id);

        if (showtime is null)
        {
            return NotFound();
        }

        return Ok(showtime);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        CreateShowtimeRequest request)
    {
        var showtime =
            await _showtimeService.CreateAsync(request);

        return CreatedAtAction(
            nameof(GetById),
            new { id = showtime.Id },
            showtime);
    }
}
