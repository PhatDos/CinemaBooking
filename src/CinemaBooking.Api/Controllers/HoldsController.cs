using CinemaBooking.Api.Authentication;
using CinemaBooking.Modules.Booking.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/holds")]
public class HoldsController : ControllerBase
{
    private readonly IBookingModule _bookingModule;

    public HoldsController(IBookingModule bookingModule)
    {
        _bookingModule = bookingModule;
    }

    [Authorize]
    [HttpDelete("{holdId:guid}")]
    public async Task<IActionResult> ReleaseHold(Guid holdId)
    {
        var userId = User.GetUserId();

        await _bookingModule.ReleaseHoldAsync(userId, holdId);

        return NoContent();
    }
}
