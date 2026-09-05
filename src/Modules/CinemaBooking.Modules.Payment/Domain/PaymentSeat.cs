namespace CinemaBooking.Modules.Payment.Domain;

public class PaymentSeat
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid PaymentId { get; set; }

    public Guid SeatId { get; set; }

    public decimal Price { get; set; }

    public Payment Payment { get; set; } = null!;
}
