using System.ComponentModel.DataAnnotations;

namespace CinemaBooking.Modules.Payment.Application.Payments;

public class CreatePaymentRequest
{
    [Required]
    public Guid BookingId { get; set; }
}
