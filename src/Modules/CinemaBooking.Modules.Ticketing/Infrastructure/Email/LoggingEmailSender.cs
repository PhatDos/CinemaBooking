using CinemaBooking.Modules.Ticketing.Application.Email;
using Microsoft.Extensions.Logging;

namespace CinemaBooking.Modules.Ticketing.Infrastructure.Email;

public sealed class LoggingEmailSender : IEmailSender
{
    private readonly ILogger<LoggingEmailSender> _logger;

    public LoggingEmailSender(ILogger<LoggingEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(
        EmailMessage message,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Ticket email queued for {Recipient}. Subject: {Subject}. Body: {HtmlBody}",
            message.To,
            message.Subject,
            message.HtmlBody);

        return Task.CompletedTask;
    }
}
