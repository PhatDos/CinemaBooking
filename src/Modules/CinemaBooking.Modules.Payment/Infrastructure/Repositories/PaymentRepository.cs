using CinemaBooking.Modules.Payment.Application.Interfaces;
using CinemaBooking.Modules.Payment.Domain;
using CinemaBooking.Modules.Payment.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using PaymentEntity = CinemaBooking.Modules.Payment.Domain.Payment;

namespace CinemaBooking.Modules.Payment.Infrastructure.Repositories;

public class PaymentRepository : IPaymentRepository
{
    private readonly PaymentDbContext _dbContext;

    public PaymentRepository(PaymentDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(PaymentEntity payment)
    {
        await _dbContext.Payments.AddAsync(payment);

        await _dbContext.SaveChangesAsync();
    }

    public async Task<PaymentEntity?> GetByBookingIdAsync(Guid bookingId)
    {
        return await _dbContext.Payments
            .FirstOrDefaultAsync(payment =>
                payment.BookingId == bookingId);
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
