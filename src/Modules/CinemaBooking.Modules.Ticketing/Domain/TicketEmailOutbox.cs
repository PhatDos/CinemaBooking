namespace CinemaBooking.Modules.Ticketing.Domain;

public sealed class TicketEmailOutbox
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid BookingId { get; set; }

    public Guid UserId { get; set; }

    public TicketEmailStatus Status { get; set; } =
        TicketEmailStatus.Pending;

    public int AttemptCount { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? SentAt { get; set; }

    public DateTime? NextAttemptAt { get; set; }

    public string? LastError { get; set; }
}
