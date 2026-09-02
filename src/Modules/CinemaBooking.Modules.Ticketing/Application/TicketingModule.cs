using System.Security.Cryptography;
using CinemaBooking.Modules.Ticketing.Contracts;
using CinemaBooking.Modules.Ticketing.Domain;
using CinemaBooking.Modules.Ticketing.Infrastructure.Persistence;
using CinemaBooking.SharedKernel.Exceptions;
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
                return existing
                    .OrderBy(ticket => ticket.CreatedAt)
                    .Select(ToInfo)
                    .ToList();
            }

            _dbContext.Tickets.AddRange(missing);

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
}
