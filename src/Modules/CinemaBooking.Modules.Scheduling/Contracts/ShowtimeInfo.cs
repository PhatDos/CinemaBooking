namespace CinemaBooking.Modules.Scheduling.Contracts;

public class ShowtimeInfo
{
    public Guid Id { get; set; }

    public Guid RoomId { get; set; }

    public Guid MovieId { get; set; }

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public decimal BasePrice { get; set; }
}
