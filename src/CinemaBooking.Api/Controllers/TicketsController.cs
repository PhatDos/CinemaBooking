using CinemaBooking.Api.Authorization;
using CinemaBooking.Modules.Booking.Application.Bookings;
using CinemaBooking.Modules.Booking.Domain;
using CinemaBooking.Modules.Identity.Application.Roles;
using CinemaBooking.Modules.Ticketing.Contracts;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/tickets")]
public sealed class TicketsController : ControllerBase
{
    private readonly ITicketingModule _ticketingModule;
    private readonly BookingService _bookingService;
    private readonly TicketCheckInAuthorizer _authorizer;

    public TicketsController(
        ITicketingModule ticketingModule,
        BookingService bookingService,
        TicketCheckInAuthorizer authorizer)
    {
        _ticketingModule = ticketingModule;
        _bookingService = bookingService;
        _authorizer = authorizer;
    }

    [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Staff)]
    [HttpPost("check-in")]
    public async Task<IActionResult> CheckIn(
        CheckInTicketRequest request,
        CancellationToken cancellationToken)
    {
        var ticket =
            await _ticketingModule.GetByCodeAsync(
                request.Code,
                cancellationToken)
            ?? throw new NotFoundException("Ticket not found.");

        var booking =
            await _bookingService.GetByIdAsync(ticket.BookingId)
            ?? throw new NotFoundException("Booking not found.");

        if (booking.Status != BookingStatus.Confirmed)
        {
            throw new BusinessRuleException(
                "Only confirmed bookings can be checked in.");
        }

        await _authorizer.AuthorizeAsync(
            User,
            ticket.ShowtimeId,
            cancellationToken);

        var result =
            await _ticketingModule.CheckInAsync(
                request.Code,
                cancellationToken);

        return Ok(result);
    }
}

public sealed record CheckInTicketRequest(string Code);
