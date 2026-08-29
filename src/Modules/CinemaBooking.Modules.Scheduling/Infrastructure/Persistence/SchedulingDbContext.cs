using CinemaBooking.Modules.Scheduling.Domain;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.Modules.Scheduling.Infrastructure.Persistence;

public class SchedulingDbContext : DbContext
{
    public SchedulingDbContext(
        DbContextOptions<SchedulingDbContext> options)
        : base(options)
    {
    }

    public DbSet<Showtime> Showtimes => Set<Showtime>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(SchedulingDbContext).Assembly);
    }
}
