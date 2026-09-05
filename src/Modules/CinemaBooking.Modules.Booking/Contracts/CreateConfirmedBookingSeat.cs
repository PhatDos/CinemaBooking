namespace CinemaBooking.Modules.Booking.Contracts;

public sealed record CreateConfirmedBookingSeat(
    Guid SeatId,
    decimal Price);
