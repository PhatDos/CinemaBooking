namespace CinemaBooking.Modules.Scheduling.Domain;

public class Showtime
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid MovieId { get; set; }

    public Guid RoomId { get; set; }

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public decimal BasePrice { get; set; }
}
