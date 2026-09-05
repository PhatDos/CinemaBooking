using CinemaBooking.Modules.Theater.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CinemaBooking.Modules.Theater.Infrastructure.Persistence.Configurations;

public class RoomConfiguration : IEntityTypeConfiguration<Room>
{
    public void Configure(EntityTypeBuilder<Room> builder)
    {
        builder.ToTable("Rooms", "theater");

        builder.HasKey(room => room.Id);

        builder.Property(room => room.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(room => room.IsActive)
            .IsRequired();

        builder.HasMany(room => room.Seats)
            .WithOne(seat => seat.Room)
            .HasForeignKey(seat => seat.RoomId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
