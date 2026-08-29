using CinemaBooking.Api.Authentication;
using CinemaBooking.Modules.Booking.Application.SeatHolds;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/showtimes/{showtimeId:guid}/seats")]
public class SeatHoldsController : ControllerBase
{
    private readonly SeatHoldService _seatHoldService;

    public SeatHoldsController(SeatHoldService seatHoldService)
    {
        _seatHoldService = seatHoldService;
    }

    [Authorize]
    [HttpPost("{seatId:guid}/hold")]
    public async Task<IActionResult> HoldSeat(
        Guid showtimeId,
        Guid seatId)
    {
        var userId = User.GetUserId();

        await _seatHoldService.HoldAsync(
            showtimeId,
            seatId,
            userId);

        return Ok(new
        {
            message = "Seat held successfully.",
            expiresInSeconds = SeatHoldService.HoldDurationSeconds
        });
    }
}
