using System.Text.Json;
using CinemaBooking.Modules.Booking.Contracts;
using CinemaBooking.Modules.Payment.Application.Outbox;
using CinemaBooking.Modules.Payment.Domain;
using CinemaBooking.Modules.Payment.Infrastructure.Persistence;
using CinemaBooking.Modules.Ticketing.Contracts;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PaymentEntity = CinemaBooking.Modules.Payment.Domain.Payment;

namespace CinemaBooking.Modules.Payment.Infrastructure.BackgroundJobs;

public sealed class PaymentOutboxWorker : BackgroundService
{
    private const int BatchSize = 10;
    private const int MaximumAttempts = 10;
    private const int MaximumLastErrorLength = 2000;

    private static readonly TimeSpan Interval =
        TimeSpan.FromSeconds(3);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PaymentOutboxWorker> _logger;

    public PaymentOutboxWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<PaymentOutboxWorker> logger)
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
                    "Error processing payment outbox.");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }

    private async Task ProcessBatchAsync(
        CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();

        var dbContext =
            scope.ServiceProvider.GetRequiredService<PaymentDbContext>();

        var messages =
            await dbContext.OutboxMessages
                .Where(message =>
                    message.ProcessedAt == null &&
                    message.AttemptCount < MaximumAttempts)
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
        OutboxMessage message,
        IServiceProvider serviceProvider,
        CancellationToken cancellationToken)
    {
        try
        {
            switch (message.Type)
            {
                case PaymentOutboxMessageTypes.PaymentSucceeded:
                    await ProcessPaymentSucceededAsync(
                        message,
                        serviceProvider,
                        cancellationToken);
                    break;

                default:
                    throw new InvalidOperationException(
                        $"Unsupported payment outbox message type '{message.Type}'.");
            }

            message.ProcessedAt = DateTime.UtcNow;
            message.LastError = null;
        }
        catch (Exception ex)
        {
            message.AttemptCount++;
            message.LastError = Truncate(ex.Message);

            _logger.LogError(
                ex,
                "Failed processing OutboxMessage {OutboxMessageId}.",
                message.Id);
        }
    }

    private static async Task ProcessPaymentSucceededAsync(
        OutboxMessage message,
        IServiceProvider serviceProvider,
        CancellationToken cancellationToken)
    {
        var data =
            JsonSerializer.Deserialize<PaymentSucceededOutboxMessage>(
                message.Payload)
            ?? throw new InvalidOperationException(
                "PaymentSucceeded outbox payload is invalid.");

        var bookingModule =
            serviceProvider.GetRequiredService<IBookingModule>();

        var ticketingModule =
            serviceProvider.GetRequiredService<ITicketingModule>();

        var dbContext =
            serviceProvider.GetRequiredService<PaymentDbContext>();

        var payment =
            await dbContext.Payments
                .Include(item => item.Seats)
                .FirstOrDefaultAsync(
                    item => item.Id == data.PaymentId,
                    cancellationToken)
            ?? throw new InvalidOperationException(
                "Payment not found for succeeded outbox message.");

        if (payment.FulfillmentStatus == PaymentFulfillmentStatus.Fulfilled)
        {
            return;
        }

        if (payment.FulfillmentStatus == PaymentFulfillmentStatus.Conflict)
        {
            return;
        }

        try
        {
            var booking =
                data.BookingId is not null
                    ? await FulfillExistingBookingAsync(
                        bookingModule,
                        data.BookingId.Value,
                        data.UserId,
                        cancellationToken)
                    : await CreateBookingFromPaidHoldAsync(
                        bookingModule,
                        payment,
                        data,
                        cancellationToken);

            await ticketingModule.IssueTicketsAsync(
                new IssueTicketsRequest(
                    booking.Id,
                    booking.UserId,
                    booking.ShowtimeId,
                    booking.Seats
                        .Select(seat => new IssueTicketSeat(seat.SeatId))
                        .ToArray()),
                cancellationToken);

            payment.FulfillmentStatus = PaymentFulfillmentStatus.Fulfilled;
            payment.FulfilledAt = DateTime.UtcNow;
            payment.FulfillmentFailedAt = null;
            payment.FulfillmentLastError = null;

            if (data.HoldId is not null)
            {
                await bookingModule.ReleaseHoldAsync(
                    data.UserId,
                    data.HoldId.Value);
            }
        }
        catch (ConflictException ex)
        {
            payment.FulfillmentStatus = PaymentFulfillmentStatus.Conflict;
            payment.FulfillmentFailedAt = DateTime.UtcNow;
            payment.FulfillmentLastError = Truncate(ex.Message);
        }
    }

    private static async Task<BookingPaymentInfo> FulfillExistingBookingAsync(
        IBookingModule bookingModule,
        Guid bookingId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        await bookingModule.ConfirmAsync(
            bookingId,
            userId,
            cancellationToken);

        var booking =
            await bookingModule.GetForPaymentAsync(
                bookingId,
                cancellationToken)
            ?? throw new InvalidOperationException(
                "Booking not found for paid payment.");

        if (booking.UserId != userId)
        {
            throw new InvalidOperationException(
                "Booking owner does not match paid payment.");
        }

        return booking;
    }

    private static async Task<BookingPaymentInfo> CreateBookingFromPaidHoldAsync(
        IBookingModule bookingModule,
        PaymentEntity payment,
        PaymentSucceededOutboxMessage data,
        CancellationToken cancellationToken)
    {
        if (data.HoldId is null ||
            payment.ShowtimeId is null)
        {
            throw new InvalidOperationException(
                "Paid hold payment is missing fulfillment data.");
        }

        var bookingResult =
            await bookingModule.CreateConfirmedBookingAsync(
                data.UserId,
                data.HoldId.Value,
                payment.ShowtimeId.Value,
                payment.Seats
                    .Select(seat => new CreateConfirmedBookingSeat(
                        seat.SeatId,
                        seat.Price))
                    .ToArray(),
                cancellationToken);

        payment.BookingId = bookingResult.BookingId;

        return await bookingModule.GetForPaymentAsync(
            bookingResult.BookingId,
            cancellationToken)
            ?? throw new InvalidOperationException(
                "Booking not found after paid hold fulfillment.");
    }

    private static string Truncate(string value)
    {
        return value.Length <= MaximumLastErrorLength
            ? value
            : value[..MaximumLastErrorLength];
    }
}
