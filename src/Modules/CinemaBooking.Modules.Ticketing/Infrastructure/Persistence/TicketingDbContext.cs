using CinemaBooking.Modules.Ticketing.Domain;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.Modules.Ticketing.Infrastructure.Persistence;

public sealed class TicketingDbContext : DbContext
{
    public TicketingDbContext(DbContextOptions<TicketingDbContext> options)
        : base(options)
    {
    }

    public DbSet<Ticket> Tickets => Set<Ticket>();

    public DbSet<TicketEmailOutbox> TicketEmailOutbox =>
        Set<TicketEmailOutbox>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(TicketingDbContext).Assembly);
    }
}
