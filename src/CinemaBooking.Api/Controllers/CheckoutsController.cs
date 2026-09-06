using CinemaBooking.Api.Authentication;
using CinemaBooking.Modules.Payment.Application.Payments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/checkouts")]
public class CheckoutsController : ControllerBase
{
    private readonly PaymentService _paymentService;

    public CheckoutsController(PaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMyCheckouts(
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();

        var checkouts =
            await _paymentService.GetOpenCheckoutsAsync(
                userId,
                cancellationToken);

        return Ok(checkouts);
    }

    [Authorize]
    [HttpPost("{holdId:guid}/cancel")]
    public async Task<IActionResult> Cancel(
        Guid holdId,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();

        var checkout =
            await _paymentService.CancelCheckoutAsync(
                userId,
                holdId,
                cancellationToken);

        return Ok(checkout);
    }
}
