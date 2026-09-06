using CinemaBooking.Modules.Catalog.Domain;
using CinemaBooking.Modules.Catalog.Domain.Imports;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.Modules.Catalog.Infrastructure.Persistence;

public class CatalogDbContext : DbContext
{
    public CatalogDbContext(DbContextOptions<CatalogDbContext> options)
        : base(options)
    {
    }

    public DbSet<Movie> Movies => Set<Movie>();

    public DbSet<Genre> Genres => Set<Genre>();

    public DbSet<MovieImportBatch> MovieImportBatches =>
        Set<MovieImportBatch>();

    public DbSet<MovieImportCandidate> MovieImportCandidates =>
        Set<MovieImportCandidate>();

    public DbSet<MovieExternalSource> MovieExternalSources =>
        Set<MovieExternalSource>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(CatalogDbContext).Assembly);
    }
}
