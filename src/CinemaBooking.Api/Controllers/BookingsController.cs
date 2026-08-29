using CinemaBooking.Api.Authentication;
using CinemaBooking.Modules.Booking.Application.Bookings;
using CinemaBooking.Modules.Identity.Application.Roles;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/bookings")]
public class BookingsController : ControllerBase
{
    private readonly BookingService _bookingService;

    public BookingsController(BookingService bookingService)
    {
        _bookingService = bookingService;
    }

    [Authorize(Roles = AppRoles.Admin)]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var bookings =
            await _bookingService.GetAllAsync();

        return Ok(bookings);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMyBookings()
    {
        var userId = User.GetUserId();

        var bookings =
            await _bookingService.GetByUserIdAsync(userId);

        return Ok(bookings);
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var booking =
            await _bookingService.GetByIdAsync(id);

        if (booking is null)
        {
            return NotFound();
        }

        var userId = User.GetUserId();

        if (!User.IsInRole(AppRoles.Admin) &&
            booking.UserId != userId)
        {
            return NotFound();
        }

        return Ok(booking);
    }

    [Authorize]
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var userId = User.GetUserId();

        await _bookingService.CancelAsync(userId, id);

        return NoContent();
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(
        CreateBookingRequest request)
    {
        var userId = User.GetUserId();

        var booking =
            await _bookingService.CreateAsync(
                userId,
                request);

        return CreatedAtAction(
            nameof(GetById),
            new { id = booking.Id },
            booking);
    }
}
