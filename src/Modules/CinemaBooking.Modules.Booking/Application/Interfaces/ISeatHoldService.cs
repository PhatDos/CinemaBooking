namespace CinemaBooking.Modules.Booking.Application.Interfaces;

public interface ISeatHoldService
{
    Task<bool> HoldAsync(
        Guid showtimeId,
        Guid seatId,
        Guid holderId,
        TimeSpan duration);

    Task<bool> IsHeldByAsync(
        Guid showtimeId,
        Guid seatId,
        Guid holderId);

    Task<bool> IsHeldAsync(
        Guid showtimeId,
        Guid seatId);

    Task<HashSet<Guid>> GetHeldSeatIdsAsync(
        Guid showtimeId,
        IReadOnlyCollection<Guid> seatIds);

    Task ReleaseAsync(
        Guid showtimeId,
        Guid seatId,
        Guid holderId);
}
