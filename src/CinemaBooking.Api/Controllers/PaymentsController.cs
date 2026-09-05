using CinemaBooking.Api.Authentication;
using CinemaBooking.Modules.Identity.Application.Roles;
using CinemaBooking.Modules.Payment.Application.Payments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly PaymentService _service;

    public PaymentsController(PaymentService service)
    {
        _service = service;
    }

    [Authorize]
    [HttpGet("by-booking/{bookingId:guid}")]
    public async Task<IActionResult> GetByBookingId(
        Guid bookingId,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();

        var result =
            await _service.GetByBookingIdAsync(
                userId,
                bookingId,
                User.IsInRole(AppRoles.Admin),
                cancellationToken);

        return result is null
            ? NotFound()
            : Ok(result);
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();

        var result =
            await _service.GetByIdAsync(
                userId,
                id,
                User.IsInRole(AppRoles.Admin),
                cancellationToken);

        return result is null
            ? NotFound()
            : Ok(result);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Pay(
        CreatePaymentRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();

        var result =
            await _service.PayAsync(
                userId,
                request,
                cancellationToken);

        return Ok(result);
    }
}
