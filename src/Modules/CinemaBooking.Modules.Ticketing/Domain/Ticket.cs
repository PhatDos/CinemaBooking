namespace CinemaBooking.Modules.Ticketing.Domain;

public sealed class Ticket
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid BookingId { get; set; }

    public Guid UserId { get; set; }

    public Guid ShowtimeId { get; set; }

    public Guid SeatId { get; set; }

    public string Code { get; set; } = null!;

    public TicketStatus Status { get; set; } = TicketStatus.Valid;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UsedAt { get; set; }

    public byte[] RowVersion { get; set; } = [];
}
