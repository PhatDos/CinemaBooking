using CinemaBooking.Modules.Booking.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CinemaBooking.Modules.Booking.Infrastructure.Persistence.Configurations;

public class BookingSeatConfiguration : IEntityTypeConfiguration<BookingSeat>
{
    public void Configure(EntityTypeBuilder<BookingSeat> builder)
    {
        builder.ToTable("BookingSeats", "booking");

        builder.HasKey(seat => seat.Id);

        builder.Property(seat => seat.ShowtimeId)
            .IsRequired();

        builder.Property(seat => seat.SeatId)
            .IsRequired();

        builder.Property(seat => seat.Price)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.HasIndex(seat => new
            {
                seat.ShowtimeId,
                seat.SeatId
            })
            .IsUnique();
    }
}
