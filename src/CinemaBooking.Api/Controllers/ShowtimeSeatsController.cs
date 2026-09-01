using CinemaBooking.Modules.Booking.Contracts;
using CinemaBooking.Modules.Scheduling.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/showtimes/{showtimeId:guid}/seats")]
public class ShowtimeSeatsController : ControllerBase
{
    private readonly IBookingModule _bookingModule;
    private readonly ISchedulingModule _schedulingModule;

    public ShowtimeSeatsController(
        IBookingModule bookingModule,
        ISchedulingModule schedulingModule)
    {
        _bookingModule = bookingModule;
        _schedulingModule = schedulingModule;
    }

    [HttpGet]
    public async Task<IActionResult> GetSeats(Guid showtimeId)
    {
        var showtime =
            await _schedulingModule.GetShowtimeAsync(showtimeId);

        if (showtime is null)
        {
            return NotFound();
        }

        var seats =
            await _bookingModule.GetSeatAvailabilityAsync(showtimeId);

        return Ok(seats);
    }
}
