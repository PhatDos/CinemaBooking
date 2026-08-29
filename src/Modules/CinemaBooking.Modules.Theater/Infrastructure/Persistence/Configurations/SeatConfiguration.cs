using CinemaBooking.Modules.Theater.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CinemaBooking.Modules.Theater.Infrastructure.Persistence.Configurations;

public class SeatConfiguration : IEntityTypeConfiguration<Seat>
{
    public void Configure(EntityTypeBuilder<Seat> builder)
    {
        builder.ToTable("Seats", "theater");

        builder.HasKey(seat => seat.Id);

        builder.Property(seat => seat.Row)
            .HasMaxLength(10)
            .IsRequired();

        builder.Property(seat => seat.Number)
            .IsRequired();

        builder.HasIndex(seat => new
        {
            seat.RoomId,
            seat.Row,
            seat.Number
        })
        .IsUnique();
    }
}
