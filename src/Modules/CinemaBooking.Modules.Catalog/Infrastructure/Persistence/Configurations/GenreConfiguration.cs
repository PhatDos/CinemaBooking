using CinemaBooking.Modules.Catalog.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CinemaBooking.Modules.Catalog.Infrastructure.Persistence.Configurations;

public class GenreConfiguration : IEntityTypeConfiguration<Genre>
{
    public void Configure(EntityTypeBuilder<Genre> builder)
    {
        builder.ToTable("Genres", "catalog");

        builder.HasKey(genre => genre.Id);

        builder.Property(genre => genre.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(genre => genre.Slug)
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(genre => genre.ImageUrl)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(genre => genre.CreatedAt)
            .IsRequired();

        builder.HasIndex(genre => genre.Slug)
            .IsUnique();
    }
}
