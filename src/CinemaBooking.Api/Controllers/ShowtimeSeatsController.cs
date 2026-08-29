using CinemaBooking.Modules.Booking.Application.SeatAvailability;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/showtimes/{showtimeId:guid}/seats")]
public class ShowtimeSeatsController : ControllerBase
{
    private readonly SeatAvailabilityService _seatAvailabilityService;

    public ShowtimeSeatsController(
        SeatAvailabilityService seatAvailabilityService)
    {
        _seatAvailabilityService = seatAvailabilityService;
    }

    [HttpGet]
    public async Task<IActionResult> GetSeats(Guid showtimeId)
    {
        var seats =
            await _seatAvailabilityService.GetAsync(showtimeId);

        return Ok(seats);
    }
}
