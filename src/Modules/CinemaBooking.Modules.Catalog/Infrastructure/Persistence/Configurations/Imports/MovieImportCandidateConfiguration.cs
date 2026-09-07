using CinemaBooking.Modules.Catalog.Domain.Imports;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CinemaBooking.Modules.Catalog.Infrastructure.Persistence.Configurations.Imports;

public sealed class MovieImportCandidateConfiguration :
    IEntityTypeConfiguration<MovieImportCandidate>
{
    public void Configure(EntityTypeBuilder<MovieImportCandidate> builder)
    {
        builder.ToTable("MovieImportCandidates", "catalog");

        builder.HasKey(candidate => candidate.Id);

        builder.Property(candidate => candidate.Source)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(candidate => candidate.SourceUrl)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(candidate => candidate.ListingTitle)
            .HasMaxLength(200);

        builder.Property(candidate => candidate.ListingGenres)
            .HasMaxLength(500);

        builder.Property(candidate => candidate.Popularity)
            .HasPrecision(18, 6);

        builder.Property(candidate => candidate.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(candidate => candidate.NormalizedTitle)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(candidate => candidate.Description)
            .HasMaxLength(4000)
            .IsRequired();

        builder.Property(candidate => candidate.PosterUrl)
            .HasMaxLength(1000);

        builder.Property(candidate => candidate.TrailerUrl)
            .HasMaxLength(1000);

        builder.Property(candidate => candidate.GenreName)
            .HasMaxLength(500);

        builder.Property(candidate => candidate.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(candidate => candidate.Warnings)
            .HasMaxLength(2000);

        builder.Property(candidate => candidate.DetailError)
            .HasMaxLength(2000);

        builder.Property(candidate => candidate.ContentHash)
            .HasMaxLength(64)
            .IsRequired();

        builder.HasIndex(candidate => candidate.BatchId);
        builder.HasIndex(candidate => new
        {
            candidate.Source,
            candidate.SourceUrl,
            candidate.Status
        });

        builder.HasOne(candidate => candidate.Batch)
            .WithMany(batch => batch.Candidates)
            .HasForeignKey(candidate => candidate.BatchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(candidate => candidate.MatchMovie)
            .WithMany()
            .HasForeignKey(candidate => candidate.MatchMovieId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
