using CinemaBooking.Modules.Ticketing.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CinemaBooking.Modules.Ticketing.Infrastructure.Persistence.Configurations;

public sealed class TicketEmailOutboxConfiguration :
    IEntityTypeConfiguration<TicketEmailOutbox>
{
    public void Configure(EntityTypeBuilder<TicketEmailOutbox> builder)
    {
        builder.ToTable("TicketEmailOutbox", "ticketing");

        builder.HasKey(message => message.Id);

        builder.Property(message => message.BookingId)
            .IsRequired();

        builder.Property(message => message.UserId)
            .IsRequired();

        builder.Property(message => message.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(message => message.AttemptCount)
            .IsRequired();

        builder.Property(message => message.CreatedAt)
            .IsRequired();

        builder.Property(message => message.SentAt);

        builder.Property(message => message.NextAttemptAt);

        builder.Property(message => message.LastError)
            .HasMaxLength(2000);

        builder.HasIndex(message => message.BookingId)
            .IsUnique();

        builder.HasIndex(message => new
        {
            message.Status,
            message.NextAttemptAt
        });
    }
}
