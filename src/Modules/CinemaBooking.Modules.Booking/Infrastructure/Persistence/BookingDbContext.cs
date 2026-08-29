using CinemaBooking.Modules.Booking.Domain;
using Microsoft.EntityFrameworkCore;
using BookingEntity = CinemaBooking.Modules.Booking.Domain.Booking;

namespace CinemaBooking.Modules.Booking.Infrastructure.Persistence;

public class BookingDbContext : DbContext
{
    public BookingDbContext(
        DbContextOptions<BookingDbContext> options)
        : base(options)
    {
    }

    public DbSet<BookingEntity> Bookings => Set<BookingEntity>();

    public DbSet<BookingSeat> BookingSeats => Set<BookingSeat>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(BookingDbContext).Assembly);
    }
}
