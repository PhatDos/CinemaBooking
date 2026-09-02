namespace CinemaBooking.Modules.Booking.Contracts;

public interface IBookingModule
{
    Task<BookingPaymentInfo?> GetForPaymentAsync(
        Guid bookingId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SeatAvailabilityInfo>> GetSeatAvailabilityAsync(
        Guid showtimeId);

    Task<HoldSeatsResult> HoldSeatsAsync(
        Guid userId,
        Guid showtimeId,
        IReadOnlyCollection<Guid> seatIds);

    Task<CreateBookingResult> CreateBookingAsync(
        Guid userId,
        Guid holdId);

    Task ConfirmAsync(
        Guid bookingId,
        Guid userId,
        CancellationToken cancellationToken = default);
}
