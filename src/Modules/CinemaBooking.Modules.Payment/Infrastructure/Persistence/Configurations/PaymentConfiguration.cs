using CinemaBooking.Modules.Payment.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentEntity = CinemaBooking.Modules.Payment.Domain.Payment;

namespace CinemaBooking.Modules.Payment.Infrastructure.Persistence.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<PaymentEntity>
{
    public void Configure(EntityTypeBuilder<PaymentEntity> builder)
    {
        builder.ToTable("Payments", "payment");

        builder.HasKey(payment => payment.Id);

        builder.Property(payment => payment.BookingId)
            .IsRequired();

        builder.Property(payment => payment.UserId)
            .IsRequired();

        builder.Property(payment => payment.OrderCode);

        builder.Property(payment => payment.Amount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(payment => payment.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(payment => payment.Provider)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(payment => payment.PaymentLinkId)
            .HasMaxLength(100);

        builder.Property(payment => payment.ProviderTransactionId)
            .HasMaxLength(100);

        builder.Property(payment => payment.CheckoutUrl)
            .HasMaxLength(1000);

        builder.Property(payment => payment.QrCode)
            .HasMaxLength(4000);

        builder.Property(payment => payment.CreatedAt)
            .IsRequired();

        builder.Property(payment => payment.PaidAt);

        builder.HasIndex(payment => payment.BookingId)
            .IsUnique();

        builder.HasIndex(payment => payment.OrderCode)
            .IsUnique()
            .HasFilter("[OrderCode] IS NOT NULL");

        builder.HasIndex(payment => payment.UserId);
    }
}
