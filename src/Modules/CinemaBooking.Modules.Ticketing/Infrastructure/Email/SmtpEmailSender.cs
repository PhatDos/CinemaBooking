using CinemaBooking.Modules.Ticketing.Application.Email;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace CinemaBooking.Modules.Ticketing.Infrastructure.Email;

public sealed class SmtpEmailSender : IEmailSender
{
    private readonly SmtpEmailOptions _options;

    public SmtpEmailSender(IOptions<SmtpEmailOptions> options)
    {
        _options = options.Value;
    }

    public async Task SendAsync(
        EmailMessage message,
        CancellationToken cancellationToken = default)
    {
        if (!_options.IsConfigured())
        {
            throw new InvalidOperationException(
                "SMTP email is not configured.");
        }

        var mimeMessage = new MimeMessage();
        mimeMessage.From.Add(
            new MailboxAddress(
                _options.FromName,
                _options.FromEmail));
        mimeMessage.To.Add(MailboxAddress.Parse(message.To));
        mimeMessage.Subject = message.Subject;

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = message.HtmlBody
        };

        foreach (var attachment in message.InlineAttachments ?? [])
        {
            var linkedResource =
                bodyBuilder.LinkedResources.Add(
                    $"{attachment.ContentId}.png",
                    attachment.Bytes,
                    ContentType.Parse(attachment.ContentType));

            linkedResource.ContentId = attachment.ContentId;
        }

        mimeMessage.Body = bodyBuilder.ToMessageBody();

        using var smtpClient = new SmtpClient();

        await smtpClient.ConnectAsync(
            _options.Host,
            _options.Port,
            _options.UseStartTls
                ? SecureSocketOptions.StartTls
                : SecureSocketOptions.Auto,
            cancellationToken);

        await smtpClient.AuthenticateAsync(
            _options.Username,
            _options.Password,
            cancellationToken);

        await smtpClient.SendAsync(
            mimeMessage,
            cancellationToken);

        await smtpClient.DisconnectAsync(
            true,
            cancellationToken);
    }
}
