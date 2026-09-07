using CinemaBooking.Modules.Catalog.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CinemaBooking.Modules.Catalog.Infrastructure.Persistence.Configurations;

public sealed class MovieGenreConfiguration : IEntityTypeConfiguration<MovieGenre>
{
    public void Configure(EntityTypeBuilder<MovieGenre> builder)
    {
        builder.ToTable("MovieGenres", "catalog");

        builder.HasKey(movieGenre => new
        {
            movieGenre.MovieId,
            movieGenre.GenreId
        });

        builder.Property(movieGenre => movieGenre.CreatedAt)
            .IsRequired();

        builder.HasIndex(movieGenre => movieGenre.GenreId);

        builder.HasOne(movieGenre => movieGenre.Movie)
            .WithMany(movie => movie.MovieGenres)
            .HasForeignKey(movieGenre => movieGenre.MovieId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(movieGenre => movieGenre.Genre)
            .WithMany(genre => genre.MovieGenres)
            .HasForeignKey(movieGenre => movieGenre.GenreId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
