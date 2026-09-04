namespace CinemaBooking.Modules.Ticketing.Contracts;

public sealed record TicketCheckInInfo(
    Guid TicketId,
    Guid BookingId,
    Guid ShowtimeId,
    Guid SeatId,
    string Status,
    DateTime? UsedAt);
