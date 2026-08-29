using CinemaBooking.Api.Authentication;
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
    [HttpPost]
    public async Task<IActionResult> Pay(
        CreatePaymentRequest request)
    {
        var userId = User.GetUserId();

        var result =
            await _service.PayAsync(userId, request);

        return Ok(result);
    }
}
