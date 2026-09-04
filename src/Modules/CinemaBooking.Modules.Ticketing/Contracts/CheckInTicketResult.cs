namespace CinemaBooking.Modules.Ticketing.Contracts;

public sealed record CheckInTicketResult(
    Guid TicketId,
    Guid BookingId,
    Guid ShowtimeId,
    Guid SeatId,
    string Status,
    DateTime UsedAt);
