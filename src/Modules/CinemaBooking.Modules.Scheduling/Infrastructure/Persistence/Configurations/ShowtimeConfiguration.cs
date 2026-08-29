using CinemaBooking.Modules.Scheduling.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CinemaBooking.Modules.Scheduling.Infrastructure.Persistence.Configurations;

public class ShowtimeConfiguration
    : IEntityTypeConfiguration<Showtime>
{
    public void Configure(EntityTypeBuilder<Showtime> builder)
    {
        builder.ToTable("Showtimes", "scheduling");

        builder.HasKey(showtime => showtime.Id);

        builder.Property(showtime => showtime.MovieId)
            .IsRequired();

        builder.Property(showtime => showtime.RoomId)
            .IsRequired();

        builder.Property(showtime => showtime.StartTime)
            .IsRequired();

        builder.Property(showtime => showtime.EndTime)
            .IsRequired();

        builder.Property(showtime => showtime.BasePrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.HasIndex(showtime => showtime.MovieId);

        builder.HasIndex(showtime => new
        {
            showtime.RoomId,
            showtime.StartTime
        });
    }
}
