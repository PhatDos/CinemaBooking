using CinemaBooking.Api.Authorization;
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
    private readonly CinemaManagementAuthorizer _authorizer;

    public CinemasController(
        ITheaterModule theaterModule,
        TheaterService theaterService,
        CinemaManagementAuthorizer authorizer)
    {
        _theaterModule = theaterModule;
        _theaterService = theaterService;
        _authorizer = authorizer;
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

    [HttpGet("{cinemaId:guid}/rooms")]
    public async Task<IActionResult> GetRoomsByCinema(
        Guid cinemaId)
    {
        var rooms =
            await _theaterService.GetRoomsByCinemaAsync(
                cinemaId);

        return Ok(rooms);
    }

    [HttpGet("/api/rooms/{id:guid}")]
    public async Task<IActionResult> GetRoom(
        Guid id)
    {
        var room =
            await _theaterService.GetRoomByIdAsync(id);

        if (room is null)
        {
            return NotFound();
        }

        return Ok(room);
    }

    [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Staff)]
    [HttpPost("{cinemaId:guid}/rooms")]
    public async Task<IActionResult> CreateRoom(
        Guid cinemaId,
        CreateRoomRequest request,
        CancellationToken cancellationToken)
    {
        await _authorizer.AuthorizeCinemaManagementAsync(
            User,
            cinemaId,
            cancellationToken);

        var room =
            await _theaterService.CreateRoomAsync(
                cinemaId,
                request);

        if (room is null)
        {
            return NotFound();
        }

        return CreatedAtAction(
            nameof(GetRoom),
            new { id = room.Id },
            room);
    }

    [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Staff)]
    [HttpPut("/api/rooms/{roomId:guid}")]
    public async Task<IActionResult> UpdateRoom(
        Guid roomId,
        UpdateRoomRequest request,
        CancellationToken cancellationToken)
    {
        await _authorizer.AuthorizeRoomManagementAsync(
            User,
            roomId,
            cancellationToken);

        await _theaterService.UpdateRoomAsync(
            roomId,
            request);

        return NoContent();
    }

    [HttpGet("/api/seats")]
    public async Task<IActionResult> GetAllSeats()
    {
        var seats =
            await _theaterService.GetAllSeatsAsync();

        return Ok(seats);
    }

    [HttpGet("/api/rooms/{roomId:guid}/seats")]
    public async Task<IActionResult> GetSeatsByRoom(
        Guid roomId)
    {
        var seats =
            await _theaterService.GetSeatsByRoomAsync(
                roomId);

        return Ok(seats);
    }

    [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Staff)]
    [HttpPost("/api/rooms/{roomId:guid}/seats")]
    public async Task<IActionResult> CreateSeat(
        Guid roomId,
        CreateSeatRequest request,
        CancellationToken cancellationToken)
    {
        await _authorizer.AuthorizeRoomManagementAsync(
            User,
            roomId,
            cancellationToken);

        var seat =
            await _theaterService.CreateSeatAsync(
                roomId,
                request);

        if (seat is null)
        {
            return NotFound();
        }

        return Created(string.Empty, seat);
    }

    [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Staff)]
    [HttpPost("/api/rooms/{roomId:guid}/seats/bulk")]
    public async Task<IActionResult> BulkCreateSeats(
        Guid roomId,
        BulkCreateSeatsRequest request,
        CancellationToken cancellationToken)
    {
        await _authorizer.AuthorizeRoomManagementAsync(
            User,
            roomId,
            cancellationToken);

        var result =
            await _theaterService.BulkCreateSeatsAsync(
                roomId,
                request.Seats);

        return Ok(result);
    }
}
