namespace CinemaBooking.Modules.Ticketing.Contracts;

public interface ITicketingModule
{
    Task<IReadOnlyList<TicketInfo>> IssueTicketsAsync(
        IssueTicketsRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TicketInfo>> GetTicketsByBookingAsync(
        Guid bookingId,
        Guid userId,
        CancellationToken cancellationToken = default);
}
