namespace CinemaBooking.Modules.Payment.Application.Payments;

public class CreatePaymentRequest
{
    public Guid? BookingId { get; set; }

    public Guid? HoldId { get; set; }
}
