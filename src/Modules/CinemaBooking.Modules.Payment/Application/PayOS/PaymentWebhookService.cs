using CinemaBooking.Modules.Booking.Contracts;
using CinemaBooking.Modules.Payment.Application.Interfaces;
using CinemaBooking.Modules.Payment.Domain;
using CinemaBooking.Modules.Ticketing.Contracts;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.Extensions.Logging;
using PayOS.Models.Webhooks;

namespace CinemaBooking.Modules.Payment.Application.PayOS;

public sealed class PaymentWebhookService : IPaymentWebhookService
{
    private readonly IPaymentGateway _paymentGateway;
    private readonly IPaymentRepository _paymentRepository;
    private readonly IBookingModule _bookingModule;
    private readonly ITicketingModule _ticketingModule;
    private readonly ILogger<PaymentWebhookService> _logger;

    public PaymentWebhookService(
        IPaymentGateway paymentGateway,
        IPaymentRepository paymentRepository,
        IBookingModule bookingModule,
        ITicketingModule ticketingModule,
        ILogger<PaymentWebhookService> logger)
    {
        _paymentGateway = paymentGateway;
        _paymentRepository = paymentRepository;
        _bookingModule = bookingModule;
        _ticketingModule = ticketingModule;
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

        if (payment.Status != PaymentStatus.Succeeded)
        {
            payment.Status = PaymentStatus.Succeeded;
            payment.ProviderTransactionId = data.Reference;
            payment.PaidAt = DateTime.UtcNow;

            await _paymentRepository.SaveChangesAsync(cancellationToken);
        }

        await CompleteBookingAndTicketsAsync(
            payment,
            cancellationToken);
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

    private async Task CompleteBookingAndTicketsAsync(
        Domain.Payment payment,
        CancellationToken cancellationToken)
    {
        var booking =
            await _bookingModule.GetForPaymentAsync(
                payment.BookingId,
                cancellationToken)
            ?? throw new NotFoundException("Booking not found.");

        if (booking.UserId != payment.UserId)
        {
            throw new BusinessRuleException(
                "Payment booking owner mismatch.");
        }

        if (booking.Status == "Pending")
        {
            await _bookingModule.ConfirmAsync(
                payment.BookingId,
                payment.UserId,
                cancellationToken);

            booking =
                await _bookingModule.GetForPaymentAsync(
                    payment.BookingId,
                    cancellationToken)
                ?? throw new NotFoundException("Booking not found.");
        }
        else if (booking.Status != "Confirmed")
        {
            throw new ConflictException(
                "Booking is not confirmable.");
        }

        await _ticketingModule.IssueTicketsAsync(
            new IssueTicketsRequest(
                booking.Id,
                booking.UserId,
                booking.ShowtimeId,
                booking.Seats
                    .Select(seat => new IssueTicketSeat(seat.SeatId))
                    .ToArray()),
            cancellationToken);
    }
}
