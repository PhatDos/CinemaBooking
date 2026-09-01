using CinemaBooking.Modules.Theater.Application;
using CinemaBooking.Modules.Theater.Application.Cinemas;
using CinemaBooking.Modules.Theater.Application.Rooms;
using CinemaBooking.Modules.Theater.Application.Seats;
using CinemaBooking.Modules.Identity.Application.Roles;
using CinemaBooking.Modules.Theater.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/cinemas")]
public class CinemasController : ControllerBase
{
    private readonly ITheaterModule _theaterModule;
    private readonly TheaterService _theaterService;

    public CinemasController(
        ITheaterModule theaterModule,
        TheaterService theaterService)
    {
        _theaterModule = theaterModule;
        _theaterService = theaterService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllCinemas(
        CancellationToken cancellationToken)
    {
        var cinemas =
            await _theaterModule.GetCinemasAsync(
                cancellationToken);

        return Ok(cinemas);
    }

    [Authorize(Roles = AppRoles.Admin)]
    [HttpPost]
    public async Task<IActionResult> CreateCinema(
        CreateCinemaRequest request,
        CancellationToken cancellationToken)
    {
        var cinema =
            await _theaterModule.CreateCinemaAsync(
                request.Name,
                request.Address,
                request.City,
                request.Description,
                cancellationToken);

        return CreatedAtAction(
            nameof(GetCinema),
            new { id = cinema.Id },
            cinema);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCinema(
        Guid id,
        CancellationToken cancellationToken)
    {
        var cinema =
            await _theaterModule.GetCinemaAsync(
                id,
                cancellationToken);

        if (cinema is null)
        {
            return NotFound();
        }

        return Ok(cinema);
    }

    [Authorize(Roles = AppRoles.Admin)]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateCinema(
        Guid id,
        UpdateCinemaRequest request,
        CancellationToken cancellationToken)
    {
        await _theaterModule.UpdateCinemaAsync(
            id,
            request.Name,
            request.Address,
            request.City,
            request.Description,
            request.IsActive,
            cancellationToken);

        return NoContent();
    }

    [HttpGet("/api/rooms")]
    public async Task<IActionResult> GetAllRooms()
    {
        var rooms =
            await _theaterService.GetAllRoomsAsync();

        return Ok(rooms);
    }

    [HttpGet("/api/rooms/{id:guid}")]
    public async Task<IActionResult> GetRoom(
        Guid id,
        CancellationToken cancellationToken)
    {
        var room =
            await _theaterModule.GetRoomAsync(
                id,
                cancellationToken);

        if (room is null)
        {
            return NotFound();
        }

        return Ok(room);
    }

    [Authorize(Roles = AppRoles.Admin)]
    [HttpPost("{cinemaId:guid}/rooms")]
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

    [HttpGet("/api/seats")]
    public async Task<IActionResult> GetAllSeats()
    {
        var seats =
            await _theaterService.GetAllSeatsAsync();

        return Ok(seats);
    }

    [Authorize(Roles = AppRoles.Admin)]
    [HttpPost("/api/rooms/{roomId:guid}/seats")]
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
