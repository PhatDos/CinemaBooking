namespace CinemaBooking.Modules.Scheduling.Application.Showtimes;

public class ShowtimeResponse
{
    public Guid Id { get; set; }

    public Guid MovieId { get; set; }

    public Guid RoomId { get; set; }

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public decimal BasePrice { get; set; }
}
