using CinemaBooking.Modules.Payment.Domain;
using PaymentEntity = CinemaBooking.Modules.Payment.Domain.Payment;

namespace CinemaBooking.Modules.Payment.Application.Interfaces;

public interface IPaymentRepository
{
    Task AddAsync(
        PaymentEntity payment,
        CancellationToken cancellationToken = default);

    Task<PaymentEntity?> GetByBookingIdAsync(
        Guid bookingId,
        CancellationToken cancellationToken = default);

    Task<PaymentEntity?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<PaymentEntity?> GetByOrderCodeAsync(
        long orderCode,
        CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
