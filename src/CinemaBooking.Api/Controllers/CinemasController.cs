using CinemaBooking.Modules.Theater.Application;
using CinemaBooking.Modules.Theater.Application.Cinemas;
using CinemaBooking.Modules.Theater.Application.Rooms;
using CinemaBooking.Modules.Theater.Application.Seats;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api")]
public class CinemasController : ControllerBase
{
    private readonly TheaterService _theaterService;

    public CinemasController(TheaterService theaterService)
    {
        _theaterService = theaterService;
    }

    [HttpGet("cinemas")]
    public async Task<IActionResult> GetAllCinemas()
    {
        var cinemas =
            await _theaterService.GetAllCinemasAsync();

        return Ok(cinemas);
    }

    [HttpPost("cinemas")]
    public async Task<IActionResult> CreateCinema(
        CreateCinemaRequest request)
    {
        var id = await _theaterService.CreateCinemaAsync(request);

        return CreatedAtAction(
            nameof(GetCinema),
            new { id },
            new { id });
    }

    [HttpGet("cinemas/{id:guid}")]
    public async Task<IActionResult> GetCinema(Guid id)
    {
        var cinema =
            await _theaterService.GetCinemaByIdAsync(id);

        if (cinema is null)
        {
            return NotFound();
        }

        return Ok(cinema);
    }

    [HttpGet("rooms")]
    public async Task<IActionResult> GetAllRooms()
    {
        var rooms =
            await _theaterService.GetAllRoomsAsync();

        return Ok(rooms);
    }

    [HttpPost("cinemas/{cinemaId:guid}/rooms")]
    public async Task<IActionResult> CreateRoom(
        Guid cinemaId,
        CreateRoomRequest request)
    {
        var id =
            await _theaterService.CreateRoomAsync(
                cinemaId,
                request);

        if (id is null)
        {
            return NotFound();
        }

        return Created(string.Empty, new { id });
    }

    [HttpGet("seats")]
    public async Task<IActionResult> GetAllSeats()
    {
        var seats =
            await _theaterService.GetAllSeatsAsync();

        return Ok(seats);
    }

    [HttpPost("rooms/{roomId:guid}/seats")]
    public async Task<IActionResult> CreateSeat(
        Guid roomId,
        CreateSeatRequest request)
    {
        var id =
            await _theaterService.CreateSeatAsync(
                roomId,
                request);

        if (id is null)
        {
            return NotFound();
        }

        return Created(string.Empty, new { id });
    }
}
