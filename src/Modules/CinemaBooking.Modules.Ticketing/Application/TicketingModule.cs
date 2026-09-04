using System.Security.Cryptography;
using CinemaBooking.Modules.Ticketing.Contracts;
using CinemaBooking.Modules.Ticketing.Domain;
using CinemaBooking.Modules.Ticketing.Infrastructure.Persistence;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.Modules.Ticketing.Application;

public sealed class TicketingModule : ITicketingModule
{
    private readonly TicketingDbContext _dbContext;

    public TicketingModule(TicketingDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<TicketInfo>> IssueTicketsAsync(
        IssueTicketsRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateIssueRequest(request);

        for (var attempt = 0; attempt < 2; attempt++)
        {
            var existing =
                await GetTicketEntitiesByBookingAsync(
                    request.BookingId,
                    request.UserId,
                    cancellationToken);

            var existingSeatIds =
                existing
                    .Select(ticket => ticket.SeatId)
                    .ToHashSet();

            var missing = request.Seats
                .Where(seat => !existingSeatIds.Contains(seat.SeatId))
                .Select(seat => new Ticket
                {
                    Id = Guid.NewGuid(),
                    BookingId = request.BookingId,
                    UserId = request.UserId,
                    ShowtimeId = request.ShowtimeId,
                    SeatId = seat.SeatId,
                    Code = GenerateTicketCode(),
                    Status = TicketStatus.Valid,
                    CreatedAt = DateTime.UtcNow
                })
                .ToArray();

            if (missing.Length == 0)
            {
                await EnsureTicketEmailQueuedAsync(
                    request.BookingId,
                    request.UserId,
                    cancellationToken);

                return existing
                    .OrderBy(ticket => ticket.CreatedAt)
                    .Select(ToInfo)
                    .ToList();
            }

            _dbContext.Tickets.AddRange(missing);
            await QueueTicketEmailIfMissingAsync(
                request.BookingId,
                request.UserId,
                cancellationToken);

            try
            {
                await _dbContext.SaveChangesAsync(cancellationToken);

                return existing
                    .Concat(missing)
                    .OrderBy(ticket => ticket.CreatedAt)
                    .Select(ToInfo)
                    .ToList();
            }
            catch (DbUpdateException) when (attempt == 0)
            {
                _dbContext.ChangeTracker.Clear();
            }
        }

        var tickets =
            await GetTicketEntitiesByBookingAsync(
                request.BookingId,
                request.UserId,
                cancellationToken);

        return tickets
            .OrderBy(ticket => ticket.CreatedAt)
            .Select(ToInfo)
            .ToList();
    }

    private async Task EnsureTicketEmailQueuedAsync(
        Guid bookingId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        await QueueTicketEmailIfMissingAsync(
            bookingId,
            userId,
            cancellationToken);

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            _dbContext.ChangeTracker.Clear();
        }
    }

    private async Task QueueTicketEmailIfMissingAsync(
        Guid bookingId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var queued =
            await _dbContext.TicketEmailOutbox
                .AsNoTracking()
                .AnyAsync(
                    message => message.BookingId == bookingId,
                    cancellationToken);

        if (queued)
        {
            return;
        }

        _dbContext.TicketEmailOutbox.Add(
            new TicketEmailOutbox
            {
                BookingId = bookingId,
                UserId = userId,
                Status = TicketEmailStatus.Pending,
                CreatedAt = DateTime.UtcNow
            });
    }

    public async Task<IReadOnlyList<TicketInfo>> GetTicketsByBookingAsync(
        Guid bookingId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (bookingId == Guid.Empty)
        {
            throw new BusinessRuleException("Booking id is required.");
        }

        if (userId == Guid.Empty)
        {
            throw new BusinessRuleException("User id is required.");
        }

        var tickets =
            await GetTicketEntitiesByBookingAsync(
                bookingId,
                userId,
                cancellationToken);

        return tickets
            .OrderBy(ticket => ticket.CreatedAt)
            .Select(ToInfo)
            .ToList();
    }

    public async Task<TicketCheckInInfo?> GetByCodeAsync(
        string code,
        CancellationToken cancellationToken = default)
    {
        var normalizedCode = NormalizeTicketCode(code);

        var ticket =
            await _dbContext.Tickets
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    ticket => ticket.Code == normalizedCode,
                    cancellationToken);

        return ticket is null
            ? null
            : ToCheckInInfo(ticket);
    }

    public async Task<CheckInTicketResult> CheckInAsync(
        string code,
        CancellationToken cancellationToken = default)
    {
        var normalizedCode = NormalizeTicketCode(code);

        var ticket =
            await _dbContext.Tickets
                .SingleOrDefaultAsync(
                    ticket => ticket.Code == normalizedCode,
                    cancellationToken)
            ?? throw new NotFoundException("Ticket not found.");

        if (ticket.Status == TicketStatus.Used)
        {
            throw new ConflictException(
                "Ticket has already been used.");
        }

        if (ticket.Status == TicketStatus.Cancelled)
        {
            throw new BusinessRuleException(
                "Ticket is cancelled.");
        }

        if (ticket.Status != TicketStatus.Valid)
        {
            throw new BusinessRuleException(
                "Ticket cannot be checked in.");
        }

        var usedAt = DateTime.UtcNow;

        ticket.Status = TicketStatus.Used;
        ticket.UsedAt = usedAt;

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConflictException(
                "Ticket has already been checked in.");
        }

        return new CheckInTicketResult(
            ticket.Id,
            ticket.BookingId,
            ticket.ShowtimeId,
            ticket.SeatId,
            ticket.Status.ToString(),
            usedAt);
    }

    private async Task<List<Ticket>> GetTicketEntitiesByBookingAsync(
        Guid bookingId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await _dbContext.Tickets
            .AsNoTracking()
            .Where(ticket =>
                ticket.BookingId == bookingId &&
                ticket.UserId == userId)
            .ToListAsync(cancellationToken);
    }

    private static void ValidateIssueRequest(
        IssueTicketsRequest request)
    {
        if (request.BookingId == Guid.Empty)
        {
            throw new BusinessRuleException("Booking id is required.");
        }

        if (request.UserId == Guid.Empty)
        {
            throw new BusinessRuleException("User id is required.");
        }

        if (request.ShowtimeId == Guid.Empty)
        {
            throw new BusinessRuleException("Showtime id is required.");
        }

        if (request.Seats.Count == 0)
        {
            throw new BusinessRuleException(
                "At least one ticket seat is required.");
        }

        if (request.Seats.Any(seat => seat.SeatId == Guid.Empty))
        {
            throw new BusinessRuleException("Seat id is required.");
        }

        if (request.Seats.Select(seat => seat.SeatId).Distinct().Count() !=
            request.Seats.Count)
        {
            throw new BusinessRuleException(
                "Duplicate ticket seats are not allowed.");
        }
    }

    private static string GenerateTicketCode()
    {
        return $"TKT_{Convert.ToHexString(
            RandomNumberGenerator.GetBytes(32))}";
    }

    private static string NormalizeTicketCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new BusinessRuleException("Ticket code is required.");
        }

        var normalized = code.Trim();

        const string qrPayloadPrefix = "ticket:";

        if (normalized.StartsWith(
                qrPayloadPrefix,
                StringComparison.OrdinalIgnoreCase))
        {
            normalized = normalized[qrPayloadPrefix.Length..].Trim();
        }

        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new BusinessRuleException("Ticket code is required.");
        }

        return normalized;
    }

    private static bool IsUniqueViolation(DbUpdateException exception)
    {
        return exception.InnerException is SqlException sqlException &&
               sqlException.Errors
                   .Cast<SqlError>()
                   .Any(error => error.Number is 2601 or 2627);
    }

    private static TicketInfo ToInfo(Ticket ticket)
    {
        return new TicketInfo(
            ticket.Id,
            ticket.BookingId,
            ticket.ShowtimeId,
            ticket.SeatId,
            ticket.Code,
            ticket.Status.ToString());
    }

    private static TicketCheckInInfo ToCheckInInfo(Ticket ticket)
    {
        return new TicketCheckInInfo(
            ticket.Id,
            ticket.BookingId,
            ticket.ShowtimeId,
            ticket.SeatId,
            ticket.Status.ToString(),
            ticket.UsedAt);
    }
}
