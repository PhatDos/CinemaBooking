using CinemaBooking.Modules.Payment.Application.PayOS;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.Extensions.Options;
using PayOS;
using PayOS.Exceptions;
using PayOS.Models;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;

namespace CinemaBooking.Modules.Payment.Infrastructure.PayOS;

public sealed class PayOSPaymentGateway : IPaymentGateway
{
    private readonly PayOSPaymentOptions _options;

    public PayOSPaymentGateway(
        IOptions<PayOSPaymentOptions> options)
    {
        _options = options.Value;
    }

    public async Task<PaymentLinkResult> CreatePaymentLinkAsync(
        PaymentLinkRequest request,
        CancellationToken cancellationToken = default)
    {
        EnsureConfigured();

        if (request.Amount <= 0 ||
            request.Amount != decimal.Truncate(request.Amount))
        {
            throw new BusinessRuleException(
                "PayOS amount must be a positive whole VND amount.");
        }

        var client = new PayOSClient(
            _options.ClientId,
            _options.ApiKey,
            _options.ChecksumKey,
            _options.PartnerCode ?? string.Empty);

        var amount = decimal.ToInt64(request.Amount);

        var paymentRequest = new CreatePaymentLinkRequest
        {
            OrderCode = request.OrderCode,
            Amount = amount,
            Description = request.Description,
            ReturnUrl = request.ReturnUrl,
            CancelUrl = request.CancelUrl,
            Items =
            [
                new PaymentLinkItem
                {
                    Name = "Cinema ticket",
                    Quantity = 1,
                    Price = amount
                }
            ]
        };

        CreatePaymentLinkResponse paymentLink;

        try
        {
            paymentLink =
                await client.PaymentRequests.CreateAsync(
                    paymentRequest,
                    new RequestOptions<CreatePaymentLinkRequest>
                    {
                        CancellationToken = cancellationToken
                    });
        }
        catch (PayOSException ex)
        {
            throw new BusinessRuleException(
                $"PayOS payment link could not be created: {ex.Message}");
        }

        return new PaymentLinkResult(
            paymentLink.OrderCode,
            paymentLink.Amount,
            paymentLink.PaymentLinkId,
            paymentLink.Status.ToString(),
            paymentLink.CheckoutUrl,
            paymentLink.QrCode);
    }

    public async Task<PayOSWebhookResult> VerifyWebhookAsync(
        Webhook webhook,
        CancellationToken cancellationToken = default)
    {
        EnsureConfigured();

        var client = new PayOSClient(
            _options.ClientId,
            _options.ApiKey,
            _options.ChecksumKey,
            _options.PartnerCode ?? string.Empty);

        WebhookData data;

        try
        {
            data = await client.Webhooks.VerifyAsync(webhook);
        }
        catch (PayOSException ex)
        {
            throw new BusinessRuleException(
                $"Invalid PayOS webhook: {ex.Message}");
        }

        return new PayOSWebhookResult(
            data.OrderCode,
            data.Amount,
            data.Code,
            data.Description,
            data.Reference,
            data.PaymentLinkId);
    }

    private void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(_options.ClientId) ||
            string.IsNullOrWhiteSpace(_options.ApiKey) ||
            string.IsNullOrWhiteSpace(_options.ChecksumKey) ||
            string.IsNullOrWhiteSpace(_options.ReturnUrl) ||
            string.IsNullOrWhiteSpace(_options.CancelUrl))
        {
            throw new BusinessRuleException(
                "PayOS is not configured.");
        }
    }
}
