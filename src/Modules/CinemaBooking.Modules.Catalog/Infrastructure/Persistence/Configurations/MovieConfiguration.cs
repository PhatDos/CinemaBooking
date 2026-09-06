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
            .HasMaxLength(4000)
            .IsRequired();

        builder.Property(movie => movie.DurationMinutes)
            .IsRequired();

        builder.Property(movie => movie.ReleaseDate)
            .IsRequired();

        builder.Property(movie => movie.PosterUrl)
            .HasMaxLength(1000);

        builder.Property(movie => movie.PosterPublicId)
            .HasMaxLength(255);

        builder.Property(movie => movie.TrailerUrl)
            .HasMaxLength(1000);

        builder.Property(movie => movie.GenreId);

        builder.Property(movie => movie.Genre)
            .HasMaxLength(100);

        builder.Property(movie => movie.IsActive)
            .IsRequired();

        builder.HasIndex(movie => movie.IsActive);

        builder.HasOne(movie => movie.GenreRef)
            .WithMany(genre => genre.Movies)
            .HasForeignKey(movie => movie.GenreId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
