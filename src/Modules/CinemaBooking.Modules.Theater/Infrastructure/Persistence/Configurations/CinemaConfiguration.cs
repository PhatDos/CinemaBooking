using CinemaBooking.Modules.Theater.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CinemaBooking.Modules.Theater.Infrastructure.Persistence.Configurations;

public class CinemaConfiguration : IEntityTypeConfiguration<Cinema>
{
    public void Configure(EntityTypeBuilder<Cinema> builder)
    {
        builder.ToTable("Cinemas", "theater");

        builder.HasKey(cinema => cinema.Id);

        builder.Property(cinema => cinema.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(cinema => cinema.Address)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(cinema => cinema.City)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(cinema => cinema.Description)
            .HasMaxLength(1000);

        builder.Property(cinema => cinema.IsActive)
            .IsRequired();

        builder.HasIndex(cinema => cinema.City);

        builder.HasMany(cinema => cinema.Rooms)
            .WithOne(room => room.Cinema)
            .HasForeignKey(room => room.CinemaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
