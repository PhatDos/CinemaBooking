using CinemaBooking.Modules.Booking.Contracts;
using CinemaBooking.Modules.Booking.Domain;
using CinemaBooking.Modules.Booking.Application.Bookings;
using CinemaBooking.Modules.Booking.Application.SeatAvailability;
using CinemaBooking.Modules.Booking.Application.SeatHolds;
using CinemaBooking.Modules.Booking.Infrastructure.Persistence;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.Modules.Booking.Application;

public class BookingModule : IBookingModule
{
    private readonly BookingDbContext _dbContext;
    private readonly SeatAvailabilityService _seatAvailabilityService;
    private readonly SeatHoldService _seatHoldService;
    private readonly BookingService _bookingService;

    public BookingModule(
        BookingDbContext dbContext,
        SeatAvailabilityService seatAvailabilityService,
        SeatHoldService seatHoldService,
        BookingService bookingService)
    {
        _dbContext = dbContext;
        _seatAvailabilityService = seatAvailabilityService;
        _seatHoldService = seatHoldService;
        _bookingService = bookingService;
    }

    public async Task<BookingPaymentInfo?> GetForPaymentAsync(
        Guid bookingId)
    {
        return await _dbContext.Bookings
            .AsNoTracking()
            .Where(booking => booking.Id == bookingId)
            .Select(booking => new BookingPaymentInfo
            {
                Id = booking.Id,
                UserId = booking.UserId,
                TotalAmount = booking.TotalAmount,
                Status = booking.Status.ToString(),
                ExpiresAt = booking.ExpiresAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<IReadOnlyList<SeatAvailabilityInfo>> GetSeatAvailabilityAsync(
        Guid showtimeId)
    {
        var seats =
            await _seatAvailabilityService.GetAsync(showtimeId);

        return seats
            .Select(ToInfo)
            .ToList();
    }

    public async Task<HoldSeatsResult> HoldSeatsAsync(
        Guid userId,
        Guid showtimeId,
        IReadOnlyCollection<Guid> seatIds)
    {
        return await _seatHoldService.HoldAsync(
            showtimeId,
            seatIds,
            userId);
    }

    public async Task<CreateBookingResult> CreateBookingAsync(
        Guid userId,
        Guid holdId)
    {
        var booking =
            await _bookingService.CreateAsync(
                userId,
                holdId);

        return ToResult(booking);
    }

    public async Task ConfirmAsync(
        Guid bookingId,
        Guid userId)
    {
        var booking =
            await _dbContext.Bookings
                .FirstOrDefaultAsync(item =>
                    item.Id == bookingId &&
                    item.UserId == userId);

        if (booking is null)
        {
            throw new NotFoundException("Booking not found.");
        }

        if (booking.Status != BookingStatus.Pending)
        {
            throw new ConflictException(
                "Booking is no longer pending.");
        }

        if (booking.ExpiresAt is null ||
            booking.ExpiresAt <= DateTime.UtcNow)
        {
            throw new ConflictException("Booking has expired.");
        }

        booking.Status = BookingStatus.Confirmed;
        booking.ExpiresAt = null;

        try
        {
            await _dbContext.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConflictException(
                "Booking state changed. Please retry.");
        }
    }

    private static SeatAvailabilityInfo ToInfo(
        SeatAvailabilityResponse seat)
    {
        return new SeatAvailabilityInfo
        {
            SeatId = seat.SeatId,
            Row = seat.Row,
            Number = seat.Number,
            Status = seat.Status switch
            {
                SeatStatus.Available => "available",
                SeatStatus.Held => "held",
                SeatStatus.Reserved => "reserved",
                SeatStatus.Booked => "booked",
                _ => "available"
            }
        };
    }

    private static CreateBookingResult ToResult(
        BookingResponse booking)
    {
        return new CreateBookingResult
        {
            BookingId = booking.Id,
            HoldId = booking.HoldId ?? Guid.Empty,
            UserId = booking.UserId,
            ShowtimeId = booking.ShowtimeId,
            Status = booking.Status.ToString(),
            TotalAmount = booking.TotalAmount,
            SeatIds = booking.SeatIds,
            CreatedAt = booking.CreatedAt,
            ExpiresAt = booking.ExpiresAt
        };
    }
}
