using CinemaBooking.Modules.Booking.Contracts;
using CinemaBooking.Modules.Payment.Application.Interfaces;
using CinemaBooking.Modules.Payment.Application.Outbox;
using CinemaBooking.Modules.Payment.Application.PayOS;
using CinemaBooking.Modules.Payment.Domain;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PaymentEntity = CinemaBooking.Modules.Payment.Domain.Payment;

namespace CinemaBooking.Modules.Payment.Application.Payments;

public class PaymentService
{
    private const int MaximumOrderCodeAttempts = 3;

    private readonly IPaymentRepository _paymentRepository;
    private readonly IBookingModule _bookingModule;
    private readonly IPaymentGateway _paymentGateway;
    private readonly PayOSPaymentOptions _payOSOptions;
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(
        IPaymentRepository paymentRepository,
        IBookingModule bookingModule,
        IPaymentGateway paymentGateway,
        Microsoft.Extensions.Options.IOptions<PayOSPaymentOptions> payOSOptions,
        ILogger<PaymentService> logger)
    {
        _paymentRepository = paymentRepository;
        _bookingModule = bookingModule;
        _paymentGateway = paymentGateway;
        _payOSOptions = payOSOptions.Value;
        _logger = logger;
    }

    public async Task<PaymentResponse> PayAsync(
        Guid userId,
        CreatePaymentRequest request,
        CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty)
        {
            throw new BusinessRuleException("User id is required.");
        }

        if (request.BookingId == Guid.Empty)
        {
            throw new BusinessRuleException("Booking id is required.");
        }

        var booking =
            await _bookingModule.GetForPaymentAsync(
                request.BookingId,
                cancellationToken);

        if (booking is null ||
            booking.UserId != userId)
        {
            throw new NotFoundException("Booking not found.");
        }

        var existing =
            await _paymentRepository.GetByBookingIdAsync(
                booking.Id,
                cancellationToken);

        if (existing is not null)
        {
            return ToResponse(existing);
        }

        if (booking.Status != "Pending")
        {
            throw new ConflictException(
                "Booking is no longer pending.");
        }

        if (booking.ExpiresAt is null ||
            booking.ExpiresAt <= DateTime.UtcNow)
        {
            throw new ConflictException("Booking has expired.");
        }

        for (var attempt = 0; attempt < MaximumOrderCodeAttempts; attempt++)
        {
            var orderCode = GenerateOrderCode();

            var paymentLink =
                await _paymentGateway.CreatePaymentLinkAsync(
                    new PaymentLinkRequest(
                        orderCode,
                        booking.TotalAmount,
                        BuildPaymentDescription(orderCode),
                        _payOSOptions.ReturnUrl,
                        _payOSOptions.CancelUrl),
                    cancellationToken);

            var now = DateTime.UtcNow;

            var payment = new PaymentEntity
            {
                BookingId = booking.Id,
                UserId = userId,
                OrderCode = paymentLink.OrderCode,
                Amount = booking.TotalAmount,
                Status = PaymentStatus.Pending,
                Provider = "PayOS",
                PaymentLinkId = paymentLink.PaymentLinkId,
                CheckoutUrl = paymentLink.CheckoutUrl,
                QrCode = paymentLink.QrCode,
                CreatedAt = now
            };

            try
            {
                await _paymentRepository.AddAsync(
                    payment,
                    cancellationToken);

                return ToResponse(payment);
            }
            catch (DbUpdateException ex) when (
                attempt + 1 < MaximumOrderCodeAttempts &&
                IsUniqueViolation(ex))
            {
                var existingPayment =
                    await _paymentRepository.GetByBookingIdAsync(
                        booking.Id,
                        cancellationToken);

                if (existingPayment is not null)
                {
                    return ToResponse(existingPayment);
                }
            }
        }

        throw new ConflictException(
            "Could not create a unique payment order code.");
    }

    public async Task<PaymentResponse?> GetByIdAsync(
        Guid userId,
        Guid paymentId,
        bool canReadAnyPayment,
        CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty)
        {
            throw new BusinessRuleException("User id is required.");
        }

        if (paymentId == Guid.Empty)
        {
            throw new BusinessRuleException("Payment id is required.");
        }

        var payment =
            await _paymentRepository.GetByIdForUpdateAsync(
                paymentId,
                cancellationToken);

        if (payment is null)
        {
            return null;
        }

        if (!canReadAnyPayment &&
            payment.UserId != userId)
        {
            return null;
        }

        await SyncPendingPaymentAsync(
            payment,
            cancellationToken);

        return ToResponse(payment);
    }

    private async Task SyncPendingPaymentAsync(
        PaymentEntity payment,
        CancellationToken cancellationToken)
    {
        if (payment.Status != PaymentStatus.Pending ||
            payment.OrderCode is null)
        {
            return;
        }

        PaymentLinkStatusResult paymentLink;

        try
        {
            paymentLink =
                await _paymentGateway.GetPaymentLinkAsync(
                    payment.OrderCode.Value,
                    cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(
                ex,
                "Could not reconcile PayOS payment status for Payment {PaymentId}.",
                payment.Id);

            return;
        }

        if (payment.Amount != paymentLink.Amount)
        {
            _logger.LogWarning(
                "PayOS reconcile amount mismatch for Payment {PaymentId}. Expected {ExpectedAmount}, got {ActualAmount}.",
                payment.Id,
                payment.Amount,
                paymentLink.Amount);

            return;
        }

        if (!IsPaidStatus(paymentLink.Status))
        {
            return;
        }

        payment.Status = PaymentStatus.Succeeded;
        payment.PaidAt = DateTime.UtcNow;

        await _paymentRepository.AddOutboxMessageAsync(
            new OutboxMessage
            {
                Type = PaymentOutboxMessageTypes.PaymentSucceeded,
                AggregateId = payment.Id,
                Payload = System.Text.Json.JsonSerializer.Serialize(
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
            _logger.LogInformation(
                ex,
                "PayOS reconcile found an existing outbox message for Payment {PaymentId}.",
                payment.Id);
        }
    }

    internal static PaymentResponse ToResponse(PaymentEntity payment)
    {
        return new PaymentResponse
        {
            Id = payment.Id,
            BookingId = payment.BookingId,
            OrderCode = payment.OrderCode,
            Amount = payment.Amount,
            Status = payment.Status.ToString(),
            Provider = payment.Provider,
            PaymentLinkId = payment.PaymentLinkId,
            CheckoutUrl = payment.CheckoutUrl,
            QrCode = payment.QrCode,
            CreatedAt = payment.CreatedAt,
            PaidAt = payment.PaidAt
        };
    }

    private static long GenerateOrderCode()
    {
        return DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() * 1000 +
               Random.Shared.Next(0, 1000);
    }

    private static string BuildPaymentDescription(long orderCode)
    {
        return $"CB {orderCode}";
    }

    private static bool IsPaidStatus(string? status)
    {
        return string.Equals(status, "PAID", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(status, "Paid", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(status, "Succeeded", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsUniqueViolation(DbUpdateException exception)
    {
        return exception.InnerException is SqlException sqlException &&
               sqlException.Errors
                   .Cast<SqlError>()
                   .Any(error => error.Number is 2601 or 2627);
    }
}
