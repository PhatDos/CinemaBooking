namespace CinemaBooking.Modules.Payment.Application.PayOS;

public interface IPaymentWebhookService
{
    Task HandlePayOSAsync(
        global::PayOS.Models.Webhooks.Webhook webhook,
        CancellationToken cancellationToken = default);
}
