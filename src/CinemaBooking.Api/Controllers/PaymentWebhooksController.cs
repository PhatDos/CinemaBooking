using CinemaBooking.Modules.Payment.Application.PayOS;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayOS.Models.Webhooks;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/payments/webhooks")]
public sealed class PaymentWebhooksController : ControllerBase
{
    private readonly IPaymentWebhookService _service;

    public PaymentWebhooksController(
        IPaymentWebhookService service)
    {
        _service = service;
    }

    [AllowAnonymous]
    [HttpPost("payos")]
    public async Task<IActionResult> PayOS(
        [FromBody] Webhook webhook,
        CancellationToken cancellationToken)
    {
        await _service.HandlePayOSAsync(
            webhook,
            cancellationToken);

        return Ok(new { message = "OK" });
    }
}
