using CinemaBooking.Modules.Catalog.Domain.Imports;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CinemaBooking.Modules.Catalog.Infrastructure.Persistence.Configurations.Imports;

public sealed class MovieImportBatchConfiguration :
    IEntityTypeConfiguration<MovieImportBatch>
{
    public void Configure(EntityTypeBuilder<MovieImportBatch> builder)
    {
        builder.ToTable("MovieImportBatches", "catalog");

        builder.HasKey(batch => batch.Id);

        builder.Property(batch => batch.Source)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(batch => batch.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(batch => batch.Error)
            .HasMaxLength(2000);

        builder.HasIndex(batch => batch.StartedAt);
    }
}
