using CinemaBooking.Modules.Booking.Contracts;
using CinemaBooking.Modules.Payment.Application.Interfaces;
using CinemaBooking.Modules.Payment.Application.PayOS;
using CinemaBooking.Modules.Payment.Domain;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using PaymentEntity = CinemaBooking.Modules.Payment.Domain.Payment;

namespace CinemaBooking.Modules.Payment.Application.Payments;

public class PaymentService
{
    private const int MaximumOrderCodeAttempts = 3;

    private readonly IPaymentRepository _paymentRepository;
    private readonly IBookingModule _bookingModule;
    private readonly IPaymentGateway _paymentGateway;
    private readonly PayOSPaymentOptions _payOSOptions;

    public PaymentService(
        IPaymentRepository paymentRepository,
        IBookingModule bookingModule,
        IPaymentGateway paymentGateway,
        Microsoft.Extensions.Options.IOptions<PayOSPaymentOptions> payOSOptions)
    {
        _paymentRepository = paymentRepository;
        _bookingModule = bookingModule;
        _paymentGateway = paymentGateway;
        _payOSOptions = payOSOptions.Value;
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
            await _paymentRepository.GetByIdAsync(
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

        return ToResponse(payment);
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

    private static bool IsUniqueViolation(DbUpdateException exception)
    {
        return exception.InnerException is SqlException sqlException &&
               sqlException.Errors
                   .Cast<SqlError>()
                   .Any(error => error.Number is 2601 or 2627);
    }
}
