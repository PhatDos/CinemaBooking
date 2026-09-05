namespace CinemaBooking.Modules.Theater.Domain;

public class Seat
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Row { get; set; } = string.Empty;

    public int Number { get; set; }

    public SeatType Type { get; set; } = SeatType.Standard;

    public Guid RoomId { get; set; }

    public Room Room { get; set; } = null!;
}
