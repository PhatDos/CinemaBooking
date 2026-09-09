using CinemaBooking.Api.Authorization;
using CinemaBooking.Api.Infrastructure.Caching;
using CinemaBooking.Modules.Catalog.Contracts;
using CinemaBooking.Modules.Theater.Application;
using CinemaBooking.Modules.Theater.Application.Cinemas;
using CinemaBooking.Modules.Theater.Application.Rooms;
using CinemaBooking.Modules.Theater.Application.Seats;
using CinemaBooking.Modules.Identity.Application.Roles;
using CinemaBooking.Modules.Scheduling.Contracts;
using CinemaBooking.Modules.Theater.Contracts;
using CinemaBooking.SharedKernel.Caching;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/cinemas")]
public class CinemasController : ControllerBase
{
    private readonly ITheaterModule _theaterModule;
    private readonly TheaterService _theaterService;
    private readonly ISchedulingModule _schedulingModule;
    private readonly ICatalogModule _catalogModule;
    private readonly CinemaManagementAuthorizer _authorizer;
    private readonly IAppCache _cache;
    private readonly AppCacheKeys _cacheKeys;

    public CinemasController(
        ITheaterModule theaterModule,
        TheaterService theaterService,
        ISchedulingModule schedulingModule,
        ICatalogModule catalogModule,
        CinemaManagementAuthorizer authorizer,
        IAppCache cache,
        AppCacheKeys cacheKeys)
    {
        _theaterModule = theaterModule;
        _theaterService = theaterService;
        _schedulingModule = schedulingModule;
        _catalogModule = catalogModule;
        _authorizer = authorizer;
        _cache = cache;
        _cacheKeys = cacheKeys;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllCinemas(
        [FromQuery] string? provinceCode,
        [FromQuery] string? wardCode,
        CancellationToken cancellationToken)
    {
        var normalizedProvinceCode = NormalizeQueryCode(provinceCode);
        var normalizedWardCode = NormalizeQueryCode(wardCode);

        var cinemas =
            await _cache.GetOrCreateAsync(
                _cacheKeys.CinemaList(
                    normalizedProvinceCode,
                    normalizedWardCode),
                [AppCacheTags.TheaterCinemas],
                TimeSpan.FromMinutes(20),
                token => _theaterModule.GetCinemasAsync(
                    normalizedProvinceCode,
                    normalizedWardCode,
                    token),
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
                request.ImageUrl,
                request.ProvinceCode,
                request.ProvinceName,
                request.WardCode,
                request.WardName,
                request.AddressLine,
                cancellationToken);
        await _cache.InvalidateTagsAsync(
            [AppCacheTags.TheaterCinemas],
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
            await _cache.GetOrCreateAsync(
                _cacheKeys.CinemaDetail(id),
                [
                    AppCacheTags.TheaterCinemas,
                    AppCacheTags.TheaterCinema(id)
                ],
                TimeSpan.FromMinutes(20),
                token => _theaterModule.GetCinemaAsync(
                    id,
                    token),
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
            request.ImageUrl,
            request.IsActive,
            request.ProvinceCode,
            request.ProvinceName,
            request.WardCode,
            request.WardName,
            request.AddressLine,
            cancellationToken);
        await _cache.InvalidateTagsAsync(
            [
                AppCacheTags.TheaterCinemas,
                AppCacheTags.TheaterCinema(id)
            ],
            cancellationToken);

        return NoContent();
    }

    [HttpGet("{cinemaId:guid}/showtimes")]
    public async Task<IActionResult> GetUpcomingShowtimesByCinema(
        Guid cinemaId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] bool includePast = false,
        CancellationToken cancellationToken = default)
    {
        var cinema =
            await _theaterModule.GetCinemaAsync(
                cinemaId,
                cancellationToken);

        if (cinema is null || !cinema.IsActive)
        {
            return NotFound();
        }

        if (from is not null &&
            to is not null &&
            from > to)
        {
            return BadRequest(new
            {
                message = "Showtime start date must be before end date."
            });
        }

        var rooms =
            await _theaterModule.GetRoomsByCinemaAsync(
                cinemaId,
                cancellationToken);

        var activeRooms = rooms
            .Where(room => room.IsActive)
            .ToList();

        var showtimes =
            await _schedulingModule.GetShowtimesByRoomIdsAsync(
                activeRooms.Select(room => room.Id).ToArray(),
                from,
                to,
                CanIncludePastShowtimes(includePast),
                cancellationToken: cancellationToken);

        var response =
            await BuildCinemaShowtimesAsync(
                showtimes,
                activeRooms,
                includeInactiveMovies: false,
                cancellationToken);

        return Ok(response);
    }

    [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Staff)]
    [HttpGet("{cinemaId:guid}/showtimes/history")]
    public async Task<IActionResult> GetShowtimeHistoryByCinema(
        Guid cinemaId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken cancellationToken)
    {
        await _authorizer.AuthorizeCinemaManagementAsync(
            User,
            cinemaId,
            cancellationToken);

        var now = DateTime.UtcNow;
        var rangeEnd = to is null || to > now
            ? now
            : to.Value;
        var rangeStart = from ?? rangeEnd.AddDays(-30);

        if (rangeStart > rangeEnd)
        {
            throw new BusinessRuleException(
                "History start date must be before end date.");
        }

        var rooms =
            await _theaterModule.GetRoomsByCinemaAsync(
                cinemaId,
                cancellationToken);

        var showtimes =
            await _schedulingModule.GetShowtimesByRoomIdsAsync(
                rooms.Select(room => room.Id).ToArray(),
                rangeStart,
                rangeEnd,
                includePast: true,
                cancellationToken);

        var response =
            await BuildCinemaShowtimesAsync(
                showtimes.Reverse().ToArray(),
                rooms,
                includeInactiveMovies: true,
                cancellationToken);

        return Ok(response);
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
            await _cache.GetOrCreateAsync(
                _cacheKeys.RoomSeatLayout(roomId),
                [AppCacheTags.TheaterRoomSeats(roomId)],
                TimeSpan.FromHours(2),
                _ => _theaterService.GetSeatsByRoomAsync(
                    roomId),
                HttpContext.RequestAborted);

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

        await _cache.InvalidateTagsAsync(
            [AppCacheTags.TheaterRoomSeats(roomId)],
            cancellationToken);

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
        await _cache.InvalidateTagsAsync(
            [AppCacheTags.TheaterRoomSeats(roomId)],
            cancellationToken);

        return Ok(result);
    }

    private static string? NormalizeQueryCode(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim().ToUpperInvariant();
    }

    private bool CanIncludePastShowtimes(bool includePast)
    {
        return includePast &&
            (User.IsInRole(AppRoles.Admin) ||
                User.IsInRole(AppRoles.Staff));
    }

    private async Task<IReadOnlyList<CinemaShowtimeResponse>> BuildCinemaShowtimesAsync(
        IReadOnlyCollection<ShowtimeInfo> showtimes,
        IReadOnlyCollection<RoomInfo> rooms,
        bool includeInactiveMovies,
        CancellationToken cancellationToken)
    {
        if (showtimes.Count == 0)
        {
            return [];
        }

        var movies =
            await _catalogModule.GetMoviesByIdsAsync(
                showtimes
                    .Select(showtime => showtime.MovieId)
                    .Distinct()
                    .ToArray(),
                cancellationToken);

        var moviesById =
            movies.ToDictionary(movie => movie.Id);
        var roomsById =
            rooms.ToDictionary(room => room.Id);

        return showtimes
            .Where(showtime =>
                moviesById.ContainsKey(showtime.MovieId) &&
                roomsById.ContainsKey(showtime.RoomId) &&
                (includeInactiveMovies ||
                    moviesById[showtime.MovieId].IsActive))
            .Select(showtime =>
            {
                var movie = moviesById[showtime.MovieId];
                var room = roomsById[showtime.RoomId];

                return new CinemaShowtimeResponse(
                    showtime.Id,
                    movie.Id,
                    movie.Title,
                    movie.PosterUrl,
                    movie.GenreId,
                    movie.Genre,
                    room.Id,
                    room.Name,
                    showtime.StartTime,
                    showtime.EndTime,
                    showtime.BasePrice,
                    showtime.StandardPrice,
                    showtime.VipPrice,
                    showtime.CouplePrice);
            })
            .ToList();
    }
}

public sealed record CinemaShowtimeResponse(
    Guid ShowtimeId,
    Guid MovieId,
    string MovieTitle,
    string? PosterUrl,
    Guid? GenreId,
    string? Genre,
    Guid RoomId,
    string RoomName,
    DateTime StartTime,
    DateTime EndTime,
    decimal BasePrice,
    decimal StandardPrice,
    decimal VipPrice,
    decimal CouplePrice);
