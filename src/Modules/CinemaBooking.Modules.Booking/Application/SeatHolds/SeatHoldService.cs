using CinemaBooking.Modules.Booking.Application.Interfaces;
using CinemaBooking.Modules.Booking.Contracts;
using CinemaBooking.Modules.Booking.Domain;
using CinemaBooking.Modules.Scheduling.Contracts;
using CinemaBooking.Modules.Theater.Contracts;
using CinemaBooking.SharedKernel.Exceptions;

namespace CinemaBooking.Modules.Booking.Application.SeatHolds;

public class SeatHoldService
{
    public const int HoldDurationSeconds = 300;

    private readonly ISeatHoldService _seatHoldService;
    private readonly ISchedulingModule _schedulingModule;
    private readonly ITheaterModule _theaterModule;
    private readonly IBookingRepository _bookingRepository;

    public SeatHoldService(
        ISeatHoldService seatHoldService,
        ISchedulingModule schedulingModule,
        ITheaterModule theaterModule,
        IBookingRepository bookingRepository)
    {
        _seatHoldService = seatHoldService;
        _schedulingModule = schedulingModule;
        _theaterModule = theaterModule;
        _bookingRepository = bookingRepository;
    }

    public async Task HoldAsync(
        Guid showtimeId,
        Guid seatId,
        Guid holderId)
    {
        await HoldAsync(
            showtimeId,
            new[] { seatId },
            holderId);
    }

    public async Task<HoldSeatsResult> HoldAsync(
        Guid showtimeId,
        IReadOnlyCollection<Guid> seatIds,
        Guid holderId)
    {
        if (holderId == Guid.Empty)
        {
            throw new BusinessRuleException("Holder id is required.");
        }

        if (seatIds.Count == 0)
        {
            throw new BusinessRuleException(
                "At least one seat is required.");
        }

        var distinctSeatIds = seatIds
            .Distinct()
            .ToList();

        if (distinctSeatIds.Count != seatIds.Count)
        {
            throw new BusinessRuleException(
                "Duplicate seats are not allowed.");
        }

        var showtime =
            await _schedulingModule.GetShowtimeAsync(showtimeId);

        if (showtime is null)
        {
            throw new NotFoundException("Showtime not found.");
        }

        foreach (var seatId in distinctSeatIds)
        {
            var validSeat =
                await _theaterModule.SeatBelongsToRoomAsync(
                    seatId,
                    showtime.RoomId);

            if (!validSeat)
            {
                throw new BusinessRuleException(
                    $"Seat {seatId} does not belong to this showtime.");
            }
        }

        await EnsureSeatsAreAvailableInSqlAsync(
            showtimeId,
            distinctSeatIds);

        var holdId = Guid.NewGuid();
        var expiresAt =
            DateTimeOffset.UtcNow.AddSeconds(HoldDurationSeconds);
        var hold = new SeatHoldMetadata(
            holdId,
            holderId,
            showtimeId,
            distinctSeatIds,
            expiresAt);

        var success =
            await _seatHoldService.HoldManyAsync(hold);

        if (!success)
        {
            throw new ConflictException(
                "One or more seats are currently held.");
        }

        try
        {
            await EnsureSeatsAreAvailableInSqlAsync(
                showtimeId,
                distinctSeatIds);
        }
        catch
        {
            await _seatHoldService.ReleaseAsync(hold);

            throw;
        }

        return new HoldSeatsResult
        {
            HoldId = holdId,
            ShowtimeId = showtimeId,
            SeatIds = distinctSeatIds,
            ExpiresAt = expiresAt
        };
    }

    private async Task EnsureSeatsAreAvailableInSqlAsync(
        Guid showtimeId,
        IReadOnlyCollection<Guid> seatIds)
    {
        var selectedSeatIds = seatIds.ToHashSet();

        var unavailableSeatIds =
            (await _bookingRepository.GetSeatStatusesAsync(showtimeId))
            .Where(seat =>
                selectedSeatIds.Contains(seat.SeatId) &&
                seat.BookingStatus is
                    BookingStatus.Pending or BookingStatus.Confirmed)
            .Select(seat => seat.SeatId)
            .ToList();

        if (unavailableSeatIds.Count > 0)
        {
            throw new ConflictException(
                "One or more seats are no longer available.");
        }
    }

}
