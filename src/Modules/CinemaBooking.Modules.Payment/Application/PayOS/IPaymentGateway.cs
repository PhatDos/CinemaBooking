namespace CinemaBooking.Modules.Payment.Application.PayOS;

public interface IPaymentGateway
{
    Task<PaymentLinkResult> CreatePaymentLinkAsync(
        PaymentLinkRequest request,
        CancellationToken cancellationToken = default);

    Task<PayOSWebhookResult> VerifyWebhookAsync(
        global::PayOS.Models.Webhooks.Webhook webhook,
        CancellationToken cancellationToken = default);
}
