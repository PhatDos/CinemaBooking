using CinemaBooking.Modules.Payment.Domain;
using PaymentEntity = CinemaBooking.Modules.Payment.Domain.Payment;

namespace CinemaBooking.Modules.Payment.Application.Interfaces;

public interface IPaymentRepository
{
    Task AddAsync(PaymentEntity payment);

    Task<PaymentEntity?> GetByBookingIdAsync(Guid bookingId);

    Task SaveChangesAsync();
}
