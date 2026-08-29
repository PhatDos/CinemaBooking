using CinemaBooking.Modules.Payment.Domain;
using Microsoft.EntityFrameworkCore;
using PaymentEntity = CinemaBooking.Modules.Payment.Domain.Payment;

namespace CinemaBooking.Modules.Payment.Infrastructure.Persistence;

public class PaymentDbContext : DbContext
{
    public PaymentDbContext(DbContextOptions<PaymentDbContext> options)
        : base(options)
    {
    }

    public DbSet<PaymentEntity> Payments => Set<PaymentEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(PaymentDbContext).Assembly);
    }
}
