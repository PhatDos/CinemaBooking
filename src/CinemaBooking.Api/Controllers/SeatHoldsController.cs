using CinemaBooking.Api.Authentication;
using CinemaBooking.Modules.Booking.Application.SeatHolds;
using CinemaBooking.Modules.Booking.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/showtimes/{showtimeId:guid}")]
public class SeatHoldsController : ControllerBase
{
    private readonly IBookingModule _bookingModule;

    public SeatHoldsController(IBookingModule bookingModule)
    {
        _bookingModule = bookingModule;
    }

    [Authorize]
    [HttpPost("holds")]
    public async Task<IActionResult> HoldSeats(
        Guid showtimeId,
        [FromBody] HoldSeatsRequest request)
    {
        var userId = User.GetUserId();

        var response =
            await _bookingModule.HoldSeatsAsync(
                userId,
                showtimeId,
                request.SeatIds);

        return Ok(response);
    }

    [Authorize]
    [HttpPost("seats/{seatId:guid}/hold")]
    public async Task<IActionResult> HoldSeat(
        Guid showtimeId,
        Guid seatId)
    {
        var userId = User.GetUserId();

        await _bookingModule.HoldSeatsAsync(
            userId,
            showtimeId,
            [seatId]);

        return Ok(new
        {
            message = "Seat held successfully.",
            expiresInSeconds = SeatHoldService.HoldDurationSeconds
        });
    }
}
