using CinemaBooking.Modules.Catalog.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CinemaBooking.Modules.Catalog.Infrastructure.Persistence.Configurations;

public class MovieConfiguration : IEntityTypeConfiguration<Movie>
{
    public void Configure(EntityTypeBuilder<Movie> builder)
    {
        builder.ToTable("Movies", "catalog");

        builder.HasKey(movie => movie.Id);

        builder.Property(movie => movie.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(movie => movie.Description)
            .HasMaxLength(2000);

        builder.Property(movie => movie.DurationMinutes)
            .IsRequired();

        builder.Property(movie => movie.ReleaseDate)
            .IsRequired();
    }
}
