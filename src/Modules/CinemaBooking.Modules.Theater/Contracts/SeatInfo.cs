namespace CinemaBooking.Modules.Theater.Contracts;

public class SeatInfo
{
    public Guid Id { get; set; }

    public string Row { get; set; } = string.Empty;

    public int Number { get; set; }
}
