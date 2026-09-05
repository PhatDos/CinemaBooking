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

    Task ReleaseHoldAsync(
        Guid userId,
        Guid holdId);

    Task<CreateBookingResult> CreateBookingAsync(
        Guid userId,
        Guid holdId);

    Task ExtendExpirationAsync(
        Guid bookingId,
        Guid userId,
        DateTime expiresAt,
        CancellationToken cancellationToken = default);

    Task ConfirmAsync(
        Guid bookingId,
        Guid userId,
        CancellationToken cancellationToken = default);
}
