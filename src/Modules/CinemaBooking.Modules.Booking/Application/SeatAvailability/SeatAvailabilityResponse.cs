namespace CinemaBooking.Modules.Booking.Application.SeatAvailability;

public class SeatAvailabilityResponse
{
    public Guid SeatId { get; set; }

    public string Row { get; set; } = string.Empty;

    public int Number { get; set; }

    public SeatStatus Status { get; set; }
}
