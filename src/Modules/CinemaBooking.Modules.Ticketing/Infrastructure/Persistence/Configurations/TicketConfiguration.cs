using CinemaBooking.Modules.Ticketing.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CinemaBooking.Modules.Ticketing.Infrastructure.Persistence.Configurations;

public sealed class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> builder)
    {
        builder.ToTable("Tickets", "ticketing");

        builder.HasKey(ticket => ticket.Id);

        builder.Property(ticket => ticket.BookingId)
            .IsRequired();

        builder.Property(ticket => ticket.UserId)
            .IsRequired();

        builder.Property(ticket => ticket.ShowtimeId)
            .IsRequired();

        builder.Property(ticket => ticket.SeatId)
            .IsRequired();

        builder.Property(ticket => ticket.Code)
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(ticket => ticket.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(ticket => ticket.CreatedAt)
            .IsRequired();

        builder.Property(ticket => ticket.UsedAt);

        builder.HasIndex(ticket => ticket.Code)
            .IsUnique();

        builder.HasIndex(ticket => ticket.BookingId);

        builder.HasIndex(ticket => new
            {
                ticket.BookingId,
                ticket.SeatId
            })
            .IsUnique();
    }
}
