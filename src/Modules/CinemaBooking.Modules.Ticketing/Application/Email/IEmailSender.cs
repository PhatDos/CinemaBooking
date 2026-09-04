namespace CinemaBooking.Modules.Ticketing.Application.Email;

public interface IEmailSender
{
    Task SendAsync(
        EmailMessage message,
        CancellationToken cancellationToken = default);
}
