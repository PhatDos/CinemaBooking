namespace CinemaBooking.Modules.Ticketing.Contracts;

public sealed record IssueTicketsRequest(
    Guid BookingId,
    Guid UserId,
    Guid ShowtimeId,
    IReadOnlyCollection<IssueTicketSeat> Seats);
