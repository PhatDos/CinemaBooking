using CinemaBooking.Modules.Theater.Domain;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.Modules.Theater.Infrastructure.Persistence;

public class TheaterDbContext : DbContext
{
    public TheaterDbContext(DbContextOptions<TheaterDbContext> options)
        : base(options)
    {
    }

    public DbSet<Cinema> Cinemas => Set<Cinema>();

    public DbSet<Room> Rooms => Set<Room>();

    public DbSet<Seat> Seats => Set<Seat>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(TheaterDbContext).Assembly);
    }
}
