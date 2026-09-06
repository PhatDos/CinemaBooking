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

        if (request.HoldId is not null &&
            request.HoldId != Guid.Empty)
        {
            return await PayHoldAsync(
                userId,
                request.HoldId.Value,
                cancellationToken);
        }

        if (request.BookingId is not null &&
            request.BookingId != Guid.Empty)
        {
            return await PayBookingAsync(
                userId,
                request.BookingId.Value,
                cancellationToken);
        }

        throw new BusinessRuleException(
            "Hold id is required.");
    }

    public async Task<IReadOnlyList<CheckoutResponse>> GetOpenCheckoutsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty)
        {
            throw new BusinessRuleException("User id is required.");
        }

        var payments =
            await _paymentRepository.GetOpenHoldPaymentsByUserAsync(
                userId,
                cancellationToken);

        foreach (var payment in payments)
        {
            await SyncPendingPaymentAsync(
                payment,
                cancellationToken);
        }

        var visiblePayments = payments
            .Where(payment =>
                payment.BookingId is null &&
                payment.HoldId is not null &&
                payment.Status != PaymentStatus.Cancelled &&
                payment.FulfillmentStatus != PaymentFulfillmentStatus.Fulfilled)
            .ToList();

        var paymentHoldIds = visiblePayments
            .Select(payment => payment.HoldId!.Value)
            .ToHashSet();

        var holds =
            await _bookingModule.GetActiveHoldsForPaymentAsync(
                userId,
                cancellationToken);

        var holdCheckouts = holds
            .Where(hold => !paymentHoldIds.Contains(hold.HoldId))
            .Select(ToCheckoutResponse);

        var paymentCheckouts = visiblePayments
            .Select(ToCheckoutResponse)
            .Where(checkout => checkout is not null)
            .Select(checkout => checkout!);

        return paymentCheckouts
            .Concat(holdCheckouts)
            .OrderByDescending(checkout => checkout.ExpiresAt)
            .ToList();
    }

    public async Task<CheckoutResponse> CancelCheckoutAsync(
        Guid userId,
        Guid holdId,
        CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty)
        {
            throw new BusinessRuleException("User id is required.");
        }

        if (holdId == Guid.Empty)
        {
            throw new BusinessRuleException("Hold id is required.");
        }

        var payment =
            await _paymentRepository.GetByHoldIdAsync(
                holdId,
                cancellationToken);

        if (payment is null)
        {
            var hold =
                await _bookingModule.GetHoldForPaymentAsync(
                    userId,
                    holdId,
                    cancellationToken);

            await _bookingModule.ReleaseHoldAsync(
                userId,
                holdId);

            return ToCancelledCheckoutResponse(hold);
        }

        if (payment.UserId != userId)
        {
            throw new NotFoundException("Checkout not found.");
        }

        await SyncPendingPaymentAsync(
            payment,
            cancellationToken);

        if (payment.Status == PaymentStatus.Succeeded)
        {
            throw new ConflictException(
                "Payment has already succeeded.");
        }

        if (payment.Status == PaymentStatus.Cancelled)
        {
            return ToCheckoutResponse(payment) ??
                   throw new NotFoundException("Checkout not found.");
        }

        if (payment.Status != PaymentStatus.Pending)
        {
            throw new ConflictException(
                "Payment can no longer be cancelled.");
        }

        if (payment.OrderCode is null)
        {
            throw new ConflictException(
                "Payment link is not ready to cancel.");
        }

        PaymentLinkStatusResult cancelledLink;

        try
        {
            cancelledLink =
                await _paymentGateway.CancelPaymentLinkAsync(
                    payment.OrderCode.Value,
                    "Customer cancelled checkout",
                    cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(
                ex,
                "Could not cancel PayOS payment link for Payment {PaymentId}.",
                payment.Id);

            throw new ConflictException(
                "Payment could not be cancelled. Please try again.");
        }

        if (payment.Amount != cancelledLink.Amount)
        {
            _logger.LogWarning(
                "PayOS cancel amount mismatch for Payment {PaymentId}. Expected {ExpectedAmount}, got {ActualAmount}.",
                payment.Id,
                payment.Amount,
                cancelledLink.Amount);

            throw new ConflictException(
                "Payment cancellation could not be verified.");
        }

        if (IsPaidStatus(cancelledLink.Status))
        {
            await MarkPaymentSucceededAsync(
                payment,
                cancellationToken);

            throw new ConflictException(
                "Payment has already succeeded.");
        }

        if (!IsCancelledStatus(cancelledLink.Status))
        {
            throw new ConflictException(
                "Payment is still pending and seats cannot be released yet.");
        }

        payment.Status = PaymentStatus.Cancelled;
        payment.CancelledAt = DateTime.UtcNow;

        await _paymentRepository.SaveChangesAsync(cancellationToken);

        await _bookingModule.ReleaseHoldAsync(
            userId,
            holdId);

        return ToCheckoutResponse(payment) ??
               throw new NotFoundException("Checkout not found.");
    }

    private async Task<PaymentResponse> PayHoldAsync(
        Guid userId,
        Guid holdId,
        CancellationToken cancellationToken)
    {
        var hold =
            await _bookingModule.GetHoldForPaymentAsync(
                userId,
                holdId,
                cancellationToken);

        var existing =
            await _paymentRepository.GetByHoldIdAsync(
                hold.HoldId,
                cancellationToken);

        if (existing is not null)
        {
            await SyncPendingPaymentAsync(
                existing,
                cancellationToken);

            return ToResponse(existing);
        }

        var paymentExpiresAt =
            DateTime.UtcNow.AddMinutes(GetPaymentExpirationMinutes());

        for (var attempt = 0; attempt < MaximumOrderCodeAttempts; attempt++)
        {
            var orderCode = GenerateOrderCode();

            var paymentLink =
                await _paymentGateway.CreatePaymentLinkAsync(
                    new PaymentLinkRequest(
                        orderCode,
                        hold.TotalAmount,
                        BuildPaymentDescription(orderCode),
                        _payOSOptions.ReturnUrl,
                        _payOSOptions.CancelUrl),
                    cancellationToken);

            await _bookingModule.ExtendHoldAsync(
                userId,
                hold.HoldId,
                paymentExpiresAt,
                cancellationToken);

            var now = DateTime.UtcNow;

            var payment = new PaymentEntity
            {
                BookingId = null,
                HoldId = hold.HoldId,
                UserId = userId,
                ShowtimeId = hold.ShowtimeId,
                OrderCode = paymentLink.OrderCode,
                Amount = hold.TotalAmount,
                Status = PaymentStatus.Pending,
                FulfillmentStatus = PaymentFulfillmentStatus.Pending,
                Provider = "PayOS",
                PaymentLinkId = paymentLink.PaymentLinkId,
                CheckoutUrl = paymentLink.CheckoutUrl,
                QrCode = paymentLink.QrCode,
                CreatedAt = now,
                ExpiresAt = paymentExpiresAt,
                Seats = hold.Seats
                    .Select(seat => new PaymentSeat
                    {
                        SeatId = seat.SeatId,
                        Price = seat.Price
                    })
                    .ToList()
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
                    await _paymentRepository.GetByHoldIdAsync(
                        hold.HoldId,
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

    private async Task<PaymentResponse> PayBookingAsync(
        Guid userId,
        Guid bookingId,
        CancellationToken cancellationToken)
    {
        if (bookingId == Guid.Empty)
        {
            throw new BusinessRuleException("Booking id is required.");
        }

        var booking =
            await _bookingModule.GetForPaymentAsync(
                bookingId,
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
            await SyncPendingPaymentAsync(
                existing,
                cancellationToken);

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

        var paymentExpiresAt =
            DateTime.UtcNow.AddMinutes(GetPaymentExpirationMinutes());

        await _bookingModule.ExtendExpirationAsync(
            booking.Id,
            userId,
            paymentExpiresAt,
            cancellationToken);

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
                HoldId = null,
                UserId = userId,
                ShowtimeId = booking.ShowtimeId,
                OrderCode = paymentLink.OrderCode,
                Amount = booking.TotalAmount,
                Status = PaymentStatus.Pending,
                FulfillmentStatus = PaymentFulfillmentStatus.Pending,
                Provider = "PayOS",
                PaymentLinkId = paymentLink.PaymentLinkId,
                CheckoutUrl = paymentLink.CheckoutUrl,
                QrCode = paymentLink.QrCode,
                CreatedAt = now,
                ExpiresAt = paymentExpiresAt,
                Seats = booking.Seats
                    .Select(seat => new PaymentSeat
                    {
                        SeatId = seat.SeatId,
                        Price = seat.Price
                    })
                    .ToList()
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

    public async Task<PaymentResponse?> GetByBookingIdAsync(
        Guid userId,
        Guid bookingId,
        bool canReadAnyPayment,
        CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty)
        {
            throw new BusinessRuleException("User id is required.");
        }

        if (bookingId == Guid.Empty)
        {
            throw new BusinessRuleException("Booking id is required.");
        }

        var payment =
            await _paymentRepository.GetByBookingIdAsync(
                bookingId,
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

    public async Task<PaymentResponse?> GetByHoldIdAsync(
        Guid userId,
        Guid holdId,
        bool canReadAnyPayment,
        CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty)
        {
            throw new BusinessRuleException("User id is required.");
        }

        if (holdId == Guid.Empty)
        {
            throw new BusinessRuleException("Hold id is required.");
        }

        var payment =
            await _paymentRepository.GetByHoldIdAsync(
                holdId,
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

        await MarkPaymentSucceededAsync(
            payment,
            cancellationToken);
    }

    private async Task MarkPaymentSucceededAsync(
        PaymentEntity payment,
        CancellationToken cancellationToken)
    {
        if (payment.Status == PaymentStatus.Succeeded)
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
                        payment.HoldId,
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
            HoldId = payment.HoldId,
            ShowtimeId = payment.ShowtimeId,
            OrderCode = payment.OrderCode,
            Amount = payment.Amount,
            Status = payment.Status.ToString(),
            FulfillmentStatus = payment.FulfillmentStatus.ToString(),
            FulfillmentLastError = payment.FulfillmentLastError,
            Provider = payment.Provider,
            PaymentLinkId = payment.PaymentLinkId,
            CheckoutUrl = payment.CheckoutUrl,
            QrCode = payment.QrCode,
            CreatedAt = payment.CreatedAt,
            ExpiresAt = payment.ExpiresAt,
            PaidAt = payment.PaidAt,
            CancelledAt = payment.CancelledAt,
            FulfilledAt = payment.FulfilledAt,
            FulfillmentFailedAt = payment.FulfillmentFailedAt
        };
    }

    private static CheckoutResponse ToCheckoutResponse(HoldPaymentInfo hold)
    {
        return new CheckoutResponse
        {
            HoldId = hold.HoldId,
            UserId = hold.UserId,
            ShowtimeId = hold.ShowtimeId,
            SeatIds = hold.Seats
                .Select(seat => seat.SeatId)
                .ToArray(),
            Amount = hold.TotalAmount,
            ExpiresAt = hold.ExpiresAt,
            Status = "Held",
            Payment = null,
            CheckoutUrl = null
        };
    }

    private static CheckoutResponse ToCancelledCheckoutResponse(
        HoldPaymentInfo hold)
    {
        var response = ToCheckoutResponse(hold);
        response.Status = "Cancelled";

        return response;
    }

    private static CheckoutResponse? ToCheckoutResponse(PaymentEntity payment)
    {
        if (payment.HoldId is null ||
            payment.ShowtimeId is null)
        {
            return null;
        }

        return new CheckoutResponse
        {
            HoldId = payment.HoldId.Value,
            UserId = payment.UserId,
            ShowtimeId = payment.ShowtimeId.Value,
            SeatIds = payment.Seats
                .Select(seat => seat.SeatId)
                .ToArray(),
            Amount = payment.Amount,
            ExpiresAt = ToDateTimeOffset(
                payment.ExpiresAt ?? payment.CreatedAt),
            Status = GetCheckoutStatus(payment),
            Payment = ToResponse(payment),
            CheckoutUrl = payment.CheckoutUrl
        };
    }

    private static string GetCheckoutStatus(PaymentEntity payment)
    {
        if (payment.FulfillmentStatus == PaymentFulfillmentStatus.Conflict)
        {
            return "PaymentConflict";
        }

        return payment.Status switch
        {
            PaymentStatus.Pending => "PaymentPending",
            PaymentStatus.Succeeded => "PaymentProcessing",
            PaymentStatus.Cancelled => "Cancelled",
            PaymentStatus.Failed => "PaymentFailed",
            _ => "Held"
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

    private int GetPaymentExpirationMinutes()
    {
        return _payOSOptions.ExpirationMinutes > 0
            ? _payOSOptions.ExpirationMinutes
            : 15;
    }

    private static bool IsPaidStatus(string? status)
    {
        return string.Equals(status, "PAID", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(status, "Paid", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(status, "Succeeded", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsCancelledStatus(string? status)
    {
        return string.Equals(status, "CANCELLED", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(status, "CANCELED", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(status, "Cancelled", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(status, "Canceled", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(status, "EXPIRED", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(status, "Expired", StringComparison.OrdinalIgnoreCase);
    }

    private static DateTimeOffset ToDateTimeOffset(DateTime value)
    {
        return new DateTimeOffset(
            DateTime.SpecifyKind(value, DateTimeKind.Utc));
    }

    private static bool IsUniqueViolation(DbUpdateException exception)
    {
        return exception.InnerException is SqlException sqlException &&
               sqlException.Errors
                   .Cast<SqlError>()
                   .Any(error => error.Number is 2601 or 2627);
    }
}
