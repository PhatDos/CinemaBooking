using CinemaBooking.Api.Authorization;
using CinemaBooking.Api.Infrastructure.Caching;
using CinemaBooking.Modules.Scheduling.Application.Showtimes;
using CinemaBooking.Modules.Identity.Application.Roles;
using CinemaBooking.SharedKernel.Caching;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/showtimes")]
public class ShowtimesController : ControllerBase
{
    private readonly ShowtimeService _showtimeService;
    private readonly CinemaManagementAuthorizer _authorizer;
    private readonly IAppCache _cache;

    public ShowtimesController(
        ShowtimeService showtimeService,
        CinemaManagementAuthorizer authorizer,
        IAppCache cache)
    {
        _showtimeService = showtimeService;
        _authorizer = authorizer;
        _cache = cache;
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

    [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Staff)]
    [HttpPost]
    public async Task<IActionResult> Create(
        CreateShowtimeRequest request,
        CancellationToken cancellationToken)
    {
        await _authorizer.AuthorizeRoomAsync(
            User,
            request.RoomId,
            cancellationToken);

        var showtime =
            await _showtimeService.CreateAsync(
                request,
                cancellationToken);
        await _cache.InvalidateTagsAsync(
            [AppCacheTags.SchedulingShowtimes],
            cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { id = showtime.Id },
            showtime);
    }

    [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Staff)]
    [HttpPost("bulk")]
    public async Task<IActionResult> BulkCreate(
        BulkCreateShowtimesRequest request,
        CancellationToken cancellationToken)
    {
        await _authorizer.AuthorizeRoomAsync(
            User,
            request.RoomId,
            cancellationToken);

        var result =
            await _showtimeService.BulkCreateAsync(
                request,
                cancellationToken);
        await _cache.InvalidateTagsAsync(
            [AppCacheTags.SchedulingShowtimes],
            cancellationToken);

        return Ok(result);
    }
}
