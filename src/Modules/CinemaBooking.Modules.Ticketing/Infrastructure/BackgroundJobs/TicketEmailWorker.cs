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
                var payload = TicketQrPayload.Create(ticket.Code);
                var qrCodeBytes = qrCodeGenerator.GeneratePng(ticket.Code);

                return new TicketEmailRow(
                    label,
                    ticket.Code,
                    payload,
                    qrCodeBytes.Length);
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
                    ticketRows));

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

        builder.AppendLine("<h1>Your Cinema Tickets</h1>");
        builder.Append("<p>Hello ");
        builder.Append(WebUtility.HtmlEncode(
            string.IsNullOrWhiteSpace(user.DisplayName)
                ? user.Email
                : user.DisplayName));
        builder.AppendLine(",</p>");
        builder.Append("<p><strong>Movie:</strong> ");
        builder.Append(WebUtility.HtmlEncode(movie.Title));
        builder.AppendLine("</p>");
        builder.Append("<p><strong>Cinema:</strong> ");
        builder.Append(WebUtility.HtmlEncode(cinema.Name));
        builder.Append(" - ");
        builder.Append(WebUtility.HtmlEncode(cinema.Address));
        builder.AppendLine("</p>");
        builder.Append("<p><strong>Room:</strong> ");
        builder.Append(WebUtility.HtmlEncode(room.Name));
        builder.AppendLine("</p>");
        builder.Append("<p><strong>Showtime:</strong> ");
        builder.Append(WebUtility.HtmlEncode(
            showtime.StartTime.ToString("yyyy-MM-dd HH:mm")));
        builder.AppendLine("</p>");

        foreach (var ticket in tickets)
        {
            builder.AppendLine("<hr />");
            builder.Append("<h2>Seat ");
            builder.Append(WebUtility.HtmlEncode(ticket.SeatLabel));
            builder.AppendLine("</h2>");
            builder.Append("<p><strong>Ticket code:</strong> ");
            builder.Append(WebUtility.HtmlEncode(ticket.TicketCode));
            builder.AppendLine("</p>");
            builder.Append("<p><strong>QR payload:</strong> ");
            builder.Append(WebUtility.HtmlEncode(ticket.QrPayload));
            builder.AppendLine("</p>");
            builder.Append("<p><strong>QR PNG bytes:</strong> ");
            builder.Append(ticket.QrPngByteCount);
            builder.AppendLine("</p>");
        }

        return builder.ToString();
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
        string QrPayload,
        int QrPngByteCount);
}
