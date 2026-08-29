using CinemaBooking.Modules.Booking.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using BookingEntity = CinemaBooking.Modules.Booking.Domain.Booking;

namespace CinemaBooking.Modules.Booking.Infrastructure.Persistence.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<BookingEntity>
{
    public void Configure(EntityTypeBuilder<BookingEntity> builder)
    {
        builder.ToTable("Bookings", "booking");

        builder.HasKey(booking => booking.Id);

        builder.Property(booking => booking.UserId)
            .IsRequired();

        builder.Property(booking => booking.ShowtimeId)
            .IsRequired();

        builder.Property(booking => booking.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(booking => booking.TotalAmount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(booking => booking.CreatedAt)
            .IsRequired();

        builder.Property(booking => booking.ExpiresAt);

        builder.Property(booking => booking.RowVersion)
            .IsRowVersion();

        builder.HasIndex(booking => booking.UserId);

        builder.HasIndex(booking => new
        {
            booking.Status,
            booking.ExpiresAt
        });

        builder.HasMany(booking => booking.Seats)
            .WithOne(seat => seat.Booking)
            .HasForeignKey(seat => seat.BookingId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
