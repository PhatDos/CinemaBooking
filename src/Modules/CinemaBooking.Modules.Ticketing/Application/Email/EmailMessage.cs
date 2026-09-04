namespace CinemaBooking.Modules.Ticketing.Application.Email;

public sealed record EmailMessage(
    string To,
    string Subject,
    string HtmlBody);
