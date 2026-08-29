namespace CinemaBooking.Modules.Booking.Contracts;

public interface IBookingModule
{
    Task<BookingPaymentInfo?> GetForPaymentAsync(Guid bookingId);

    Task ConfirmAsync(
        Guid bookingId,
        Guid userId);
}
