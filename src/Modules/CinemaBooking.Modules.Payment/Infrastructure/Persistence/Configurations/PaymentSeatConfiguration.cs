using CinemaBooking.Modules.Payment.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CinemaBooking.Modules.Payment.Infrastructure.Persistence.Configurations;

public class PaymentSeatConfiguration : IEntityTypeConfiguration<PaymentSeat>
{
    public void Configure(EntityTypeBuilder<PaymentSeat> builder)
    {
        builder.ToTable("PaymentSeats", "payment");

        builder.HasKey(seat => seat.Id);

        builder.Property(seat => seat.PaymentId)
            .IsRequired();

        builder.Property(seat => seat.SeatId)
            .IsRequired();

        builder.Property(seat => seat.Price)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.HasIndex(seat => new
            {
                seat.PaymentId,
                seat.SeatId
            })
            .IsUnique();
    }
}
