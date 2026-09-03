using CinemaBooking.Modules.Payment.Application.Interfaces;
using CinemaBooking.Modules.Payment.Application.Outbox;
using CinemaBooking.Modules.Payment.Domain;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PayOS.Models.Webhooks;
using System.Text.Json;

namespace CinemaBooking.Modules.Payment.Application.PayOS;

public sealed class PaymentWebhookService : IPaymentWebhookService
{
    private readonly IPaymentGateway _paymentGateway;
    private readonly IPaymentRepository _paymentRepository;
    private readonly ILogger<PaymentWebhookService> _logger;

    public PaymentWebhookService(
        IPaymentGateway paymentGateway,
        IPaymentRepository paymentRepository,
        ILogger<PaymentWebhookService> logger)
    {
        _paymentGateway = paymentGateway;
        _paymentRepository = paymentRepository;
        _logger = logger;
    }

    public async Task HandlePayOSAsync(
        Webhook webhook,
        CancellationToken cancellationToken = default)
    {
        var data =
            await _paymentGateway.VerifyWebhookAsync(
                webhook,
                cancellationToken);

        var payment =
            await _paymentRepository.GetByOrderCodeAsync(
                data.OrderCode,
                cancellationToken);

        if (payment is null)
        {
            _logger.LogInformation(
                "Verified PayOS webhook for unknown OrderCode {OrderCode}.",
                data.OrderCode);

            return;
        }

        ValidateWebhookPayment(data, payment);

        if (!string.Equals(data.Code, "00", StringComparison.Ordinal))
        {
            return;
        }

        if (payment.Status == PaymentStatus.Succeeded)
        {
            return;
        }

        payment.Status = PaymentStatus.Succeeded;
        payment.ProviderTransactionId = data.Reference;
        payment.PaidAt = DateTime.UtcNow;

        await _paymentRepository.AddOutboxMessageAsync(
            new OutboxMessage
            {
                Type = PaymentOutboxMessageTypes.PaymentSucceeded,
                AggregateId = payment.Id,
                Payload = JsonSerializer.Serialize(
                    new PaymentSucceededOutboxMessage(
                        payment.Id,
                        payment.BookingId,
                        payment.UserId)),
                CreatedAt = DateTime.UtcNow
            },
            cancellationToken);

        try
        {
            await _paymentRepository.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            _logger.LogWarning(
                ex,
                "PayOS webhook outbox save raced for Payment {PaymentId}.",
                payment.Id);
        }
    }

    private static void ValidateWebhookPayment(
        PayOSWebhookResult data,
        Domain.Payment payment)
    {
        if (payment.Amount != data.Amount)
        {
            throw new BusinessRuleException(
                "Payment amount mismatch.");
        }

        if (!string.Equals(
                payment.PaymentLinkId,
                data.PaymentLinkId,
                StringComparison.Ordinal))
        {
            throw new BusinessRuleException(
                "Payment link mismatch.");
        }
    }

    private static bool IsUniqueViolation(DbUpdateException exception)
    {
        return exception.InnerException is SqlException sqlException &&
               sqlException.Errors
                   .Cast<SqlError>()
                   .Any(error => error.Number is 2601 or 2627);
    }
}
