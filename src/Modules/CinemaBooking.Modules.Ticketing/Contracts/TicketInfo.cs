namespace CinemaBooking.Modules.Ticketing.Contracts;

public sealed record TicketInfo(
    Guid Id,
    Guid BookingId,
    Guid ShowtimeId,
    Guid SeatId,
    string Code,
    string Status);
