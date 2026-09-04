using System.Net;
using System.Text;
using CinemaBooking.Modules.Catalog.Contracts;
using CinemaBooking.Modules.Identity.Contracts;
using CinemaBooking.Modules.Scheduling.Contracts;
using CinemaBooking.Modules.Theater.Contracts;
using CinemaBooking.Modules.Ticketing.Application.Email;
using CinemaBooking.Modules.Ticketing.Domain;
using CinemaBooking.Modules.Ticketing.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CinemaBooking.Modules.Ticketing.Infrastructure.BackgroundJobs;

public sealed class TicketEmailWorker : BackgroundService
{
    private const int BatchSize = 10;
    private const int MaximumLastErrorLength = 2000;

    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(5);
    private static readonly TimeSpan RetryDelay = TimeSpan.FromMinutes(1);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TicketEmailWorker> _logger;

    public TicketEmailWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<TicketEmailWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessBatchAsync(stoppingToken);
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error processing ticket email outbox.");
            }

            try
            {
                await Task.Delay(Interval, stoppingToken);
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    private async Task ProcessBatchAsync(
        CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();

        var dbContext =
            scope.ServiceProvider.GetRequiredService<TicketingDbContext>();

        var now = DateTime.UtcNow;

        var messages =
            await dbContext.TicketEmailOutbox
                .Where(message =>
                    message.Status != TicketEmailStatus.Sent &&
                    (message.NextAttemptAt == null ||
                     message.NextAttemptAt <= now))
                .OrderBy(message => message.CreatedAt)
                .Take(BatchSize)
                .ToListAsync(cancellationToken);

        if (messages.Count == 0)
        {
            return;
        }

        foreach (var message in messages)
        {
            await ProcessMessageAsync(
                message,
                scope.ServiceProvider,
                cancellationToken);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task ProcessMessageAsync(
        TicketEmailOutbox message,
        IServiceProvider serviceProvider,
        CancellationToken cancellationToken)
    {
        try
        {
            await SendTicketEmailAsync(
                message,
                serviceProvider,
                cancellationToken);

            message.Status = TicketEmailStatus.Sent;
            message.SentAt = DateTime.UtcNow;
            message.NextAttemptAt = null;
            message.LastError = null;
        }
        catch (Exception ex)
        {
            message.Status = TicketEmailStatus.Failed;
            message.AttemptCount++;
            message.NextAttemptAt =
                DateTime.UtcNow.Add(RetryDelay);
            message.LastError = Truncate(ex.Message);

            _logger.LogError(
                ex,
                "Failed sending ticket email for Booking {BookingId}.",
                message.BookingId);
        }
    }

    private static async Task SendTicketEmailAsync(
        TicketEmailOutbox message,
        IServiceProvider serviceProvider,
        CancellationToken cancellationToken)
    {
        var dbContext =
            serviceProvider.GetRequiredService<TicketingDbContext>();

        var tickets =
            await dbContext.Tickets
                .AsNoTracking()
                .Where(ticket =>
                    ticket.BookingId == message.BookingId &&
                    ticket.UserId == message.UserId)
                .OrderBy(ticket => ticket.CreatedAt)
                .ToListAsync(cancellationToken);

        if (tickets.Count == 0)
        {
            throw new InvalidOperationException(
                "Ticket email cannot be sent before tickets are issued.");
        }

        var identityModule =
            serviceProvider.GetRequiredService<IIdentityModule>();

        var schedulingModule =
            serviceProvider.GetRequiredService<ISchedulingModule>();

        var catalogModule =
            serviceProvider.GetRequiredService<ICatalogModule>();

        var theaterModule =
            serviceProvider.GetRequiredService<ITheaterModule>();

        var emailSender =
            serviceProvider.GetRequiredService<IEmailSender>();

        var qrCodeGenerator =
            serviceProvider.GetRequiredService<ITicketQrCodeGenerator>();

        var user =
            await identityModule.GetUserContactAsync(
                message.UserId,
                cancellationToken)
            ?? throw new InvalidOperationException(
                "Ticket email recipient was not found.");

        if (string.IsNullOrWhiteSpace(user.Email))
        {
            throw new InvalidOperationException(
                "Ticket email recipient has no email address.");
        }

        var showtime =
            await schedulingModule.GetShowtimeAsync(
                tickets[0].ShowtimeId)
            ?? throw new InvalidOperationException(
                "Ticket showtime was not found.");

        var movie =
            await catalogModule.GetMovieAsync(
                showtime.MovieId,
                cancellationToken)
            ?? throw new InvalidOperationException(
                "Ticket movie was not found.");

        var room =
            await theaterModule.GetRoomAsync(
                showtime.RoomId,
                cancellationToken)
            ?? throw new InvalidOperationException(
                "Ticket room was not found.");

        var cinema =
            await theaterModule.GetCinemaAsync(
                room.CinemaId,
                cancellationToken)
            ?? throw new InvalidOperationException(
                "Ticket cinema was not found.");

        var seats =
            await theaterModule.GetSeatsByRoomAsync(
                room.Id,
                cancellationToken);

        var seatLookup =
            seats.ToDictionary(seat => seat.Id);

        var ticketRows =
            tickets.Select(ticket =>
            {
                seatLookup.TryGetValue(ticket.SeatId, out var seat);
                var label = seat is null
                    ? ticket.SeatId.ToString()
                    : $"{seat.Row}{seat.Number}";
                var qrCodeBytes = qrCodeGenerator.GeneratePng(ticket.Code);
                var contentId = $"ticket-qr-{ticket.Id:N}";

                return new TicketEmailRow(
                    label,
                    ticket.Code,
                    contentId,
                    qrCodeBytes);
            }).ToArray();

        var email =
            new EmailMessage(
                user.Email,
                $"Your Cinema Tickets - {movie.Title}",
                BuildHtmlBody(
                    user,
                    movie,
                    cinema,
                    room,
                    showtime,
                    ticketRows),
                ticketRows
                    .Select(ticket => new EmailInlineAttachment(
                        ticket.QrContentId,
                        "image/png",
                        ticket.QrPngBytes))
                    .ToArray());

        await emailSender.SendAsync(
            email,
            cancellationToken);
    }

    private static string BuildHtmlBody(
        UserContactInfo user,
        MovieInfo movie,
        CinemaInfo cinema,
        RoomInfo room,
        ShowtimeInfo showtime,
        IReadOnlyCollection<TicketEmailRow> tickets)
    {
        var builder = new StringBuilder();
        var recipientName = string.IsNullOrWhiteSpace(user.DisplayName)
            ? user.Email
            : user.DisplayName;
        var ticketCount = tickets.Count;

        builder.AppendLine("<!doctype html>");
        builder.AppendLine("<html>");
        builder.AppendLine("<body style=\"margin:0;background:#f3f4f6;color:#111827;font-family:Arial,Helvetica,sans-serif;\">");
        builder.AppendLine("<div style=\"display:none;max-height:0;overflow:hidden;color:#f3f4f6;\">Your Cinema Booking tickets are ready.</div>");
        builder.AppendLine("<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#f3f4f6;padding:24px 12px;\">");
        builder.AppendLine("<tr><td align=\"center\">");
        builder.AppendLine("<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:680px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;\">");
        builder.AppendLine("<tr><td style=\"background:#111827;color:#ffffff;padding:28px 32px;\">");
        builder.AppendLine("<div style=\"font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#9ca3af;\">Cinema Booking</div>");
        builder.Append("<h1 style=\"margin:8px 0 0;font-size:28px;line-height:34px;font-weight:700;\">");
        builder.Append(WebUtility.HtmlEncode(movie.Title));
        builder.AppendLine("</h1>");
        builder.Append("<p style=\"margin:10px 0 0;color:#d1d5db;font-size:15px;line-height:22px;\">");
        builder.Append(WebUtility.HtmlEncode(ticketCount == 1
            ? "1 ticket confirmed"
            : $"{ticketCount} tickets confirmed"));
        builder.AppendLine("</p>");
        builder.AppendLine("</td></tr>");

        builder.AppendLine("<tr><td style=\"padding:28px 32px 8px;\">");
        builder.Append("<p style=\"margin:0 0 20px;font-size:16px;line-height:24px;\">Hello ");
        builder.Append(WebUtility.HtmlEncode(recipientName));
        builder.AppendLine(", your tickets are ready. Show the QR code at check-in.</p>");

        builder.AppendLine("<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;\">");
        AppendSummaryRow(builder, "Cinema", $"{cinema.Name} - {cinema.Address}");
        AppendSummaryRow(builder, "Room", room.Name);
        AppendSummaryRow(builder, "Showtime", showtime.StartTime.ToString("yyyy-MM-dd HH:mm"));
        builder.AppendLine("</table>");
        builder.AppendLine("</td></tr>");

        builder.AppendLine("<tr><td style=\"padding:12px 32px 32px;\">");

        foreach (var ticket in tickets)
        {
            builder.AppendLine("<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse:collapse;margin-top:16px;border:1px solid #d1d5db;border-radius:14px;overflow:hidden;\">");
            builder.AppendLine("<tr>");
            builder.AppendLine("<td style=\"padding:20px;vertical-align:top;\">");
            builder.Append("<div style=\"font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#6b7280;\">Seat</div>");
            builder.Append("<div style=\"margin-top:4px;font-size:32px;line-height:38px;font-weight:700;color:#111827;\">");
            builder.Append(WebUtility.HtmlEncode(ticket.SeatLabel));
            builder.AppendLine("</div>");
            builder.Append("<div style=\"margin-top:14px;font-size:13px;line-height:18px;color:#4b5563;\">Ticket</div>");
            builder.Append("<div style=\"display:inline-block;margin-top:6px;padding:7px 10px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:999px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:16px;font-weight:700;color:#3730a3;\">");
            builder.Append(WebUtility.HtmlEncode(
                FormatTicketCode(ticket.TicketCode)));
            builder.AppendLine("</div>");
            builder.AppendLine("<div style=\"margin-top:12px;font-size:12px;line-height:18px;color:#6b7280;\">Scan the QR code at the entrance.</div>");
            builder.AppendLine("</td>");
            builder.AppendLine("<td align=\"center\" style=\"width:170px;padding:20px;background:#f9fafb;vertical-align:middle;\">");
            builder.Append("<img alt=\"Ticket QR\" src=\"cid:");
            builder.Append(WebUtility.HtmlEncode(ticket.QrContentId));
            builder.AppendLine("\" width=\"128\" height=\"128\" style=\"display:block;width:128px;height:128px;border:8px solid #ffffff;border-radius:12px;\" />");
            builder.AppendLine("</td>");
            builder.AppendLine("</tr>");
            builder.AppendLine("</table>");
        }

        builder.AppendLine("<p style=\"margin:24px 0 0;font-size:12px;line-height:18px;color:#6b7280;\">Keep this email available until the end of your movie session.</p>");
        builder.AppendLine("</td></tr>");
        builder.AppendLine("</table>");
        builder.AppendLine("</td></tr>");
        builder.AppendLine("</table>");
        builder.AppendLine("</body>");
        builder.AppendLine("</html>");

        return builder.ToString();
    }

    private static void AppendSummaryRow(
        StringBuilder builder,
        string label,
        string value)
    {
        builder.AppendLine("<tr>");
        builder.Append("<td style=\"width:120px;padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;line-height:18px;\">");
        builder.Append(WebUtility.HtmlEncode(label));
        builder.AppendLine("</td>");
        builder.Append("<td style=\"padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;line-height:20px;font-weight:600;\">");
        builder.Append(WebUtility.HtmlEncode(value));
        builder.AppendLine("</td>");
        builder.AppendLine("</tr>");
    }

    private static string FormatTicketCode(string ticketCode)
    {
        const int visiblePrefixLength = 8;
        const int visibleSuffixLength = 6;

        if (ticketCode.Length <=
            visiblePrefixLength + visibleSuffixLength + 3)
        {
            return ticketCode;
        }

        return string.Concat(
            ticketCode.AsSpan(0, visiblePrefixLength),
            "...",
            ticketCode.AsSpan(ticketCode.Length - visibleSuffixLength));
    }

    private static string Truncate(string value)
    {
        return value.Length <= MaximumLastErrorLength
            ? value
            : value[..MaximumLastErrorLength];
    }

    private sealed record TicketEmailRow(
        string SeatLabel,
        string TicketCode,
        string QrContentId,
        byte[] QrPngBytes);
}
