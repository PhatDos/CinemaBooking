using CinemaBooking.Modules.Booking.Contracts;
using CinemaBooking.Modules.Payment.Application.Interfaces;
using CinemaBooking.Modules.Payment.Domain;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.EntityFrameworkCore;
using PaymentEntity = CinemaBooking.Modules.Payment.Domain.Payment;

namespace CinemaBooking.Modules.Payment.Application.Payments;

public class PaymentService
{
    private readonly IPaymentRepository _paymentRepository;
    private readonly IBookingModule _bookingModule;

    public PaymentService(
        IPaymentRepository paymentRepository,
        IBookingModule bookingModule)
    {
        _paymentRepository = paymentRepository;
        _bookingModule = bookingModule;
    }

    public async Task<PaymentResponse> PayAsync(
        Guid userId,
        CreatePaymentRequest request)
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
                request.BookingId);

        if (booking is null ||
            booking.UserId != userId)
        {
            throw new NotFoundException("Booking not found.");
        }

        var existing =
            await _paymentRepository.GetByBookingIdAsync(
                booking.Id);

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

        var now = DateTime.UtcNow;

        var payment = new PaymentEntity
        {
            BookingId = booking.Id,
            UserId = userId,
            Amount = booking.TotalAmount,
            Status = PaymentStatus.Pending,
            CreatedAt = now
        };

        try
        {
            await _paymentRepository.AddAsync(payment);
        }
        catch (DbUpdateException)
        {
            throw new ConflictException("Payment already exists.");
        }

        await _bookingModule.ConfirmAsync(
            booking.Id,
            userId);

        payment.Status = PaymentStatus.Succeeded;
        payment.PaidAt = DateTime.UtcNow;

        await _paymentRepository.SaveChangesAsync();

        return ToResponse(payment);
    }

    private static PaymentResponse ToResponse(PaymentEntity payment)
    {
        return new PaymentResponse
        {
            Id = payment.Id,
            BookingId = payment.BookingId,
            Amount = payment.Amount,
            Status = payment.Status.ToString(),
            CreatedAt = payment.CreatedAt,
            PaidAt = payment.PaidAt
        };
    }
}
