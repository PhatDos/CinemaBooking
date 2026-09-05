namespace CinemaBooking.Modules.Booking.Contracts;

public class SeatAvailabilityInfo
{
    public Guid SeatId { get; set; }

    public string Row { get; set; } = string.Empty;

    public int Number { get; set; }

    public string Type { get; set; } = "Standard";

    public string Status { get; set; } = string.Empty;
}
