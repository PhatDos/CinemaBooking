using CinemaBooking.Modules.Catalog.Domain.Imports;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CinemaBooking.Modules.Catalog.Infrastructure.Persistence.Configurations.Imports;

public sealed class MovieExternalSourceConfiguration :
    IEntityTypeConfiguration<MovieExternalSource>
{
    public void Configure(EntityTypeBuilder<MovieExternalSource> builder)
    {
        builder.ToTable("MovieExternalSources", "catalog");

        builder.HasKey(source => source.Id);

        builder.Property(source => source.Source)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(source => source.SourceUrl)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(source => source.ContentHash)
            .HasMaxLength(64)
            .IsRequired();

        builder.HasIndex(source => new
        {
            source.Source,
            source.SourceUrl
        }).IsUnique();

        builder.HasOne(source => source.Movie)
            .WithMany()
            .HasForeignKey(source => source.MovieId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
