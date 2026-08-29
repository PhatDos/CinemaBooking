using CinemaBooking.Modules.Booking.Application.Interfaces;
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
        if (holderId == Guid.Empty)
        {
            throw new BusinessRuleException("Holder id is required.");
        }

        var showtime =
            await _schedulingModule.GetShowtimeAsync(showtimeId);

        if (showtime is null)
        {
            throw new NotFoundException("Showtime not found.");
        }

        var validSeat =
            await _theaterModule.SeatBelongsToRoomAsync(
                seatId,
                showtime.RoomId);

        if (!validSeat)
        {
            throw new BusinessRuleException(
                "Seat does not belong to this showtime.");
        }

        var success =
            await _seatHoldService.HoldAsync(
                showtimeId,
                seatId,
                holderId,
                TimeSpan.FromSeconds(HoldDurationSeconds));

        if (!success)
        {
            throw new ConflictException(
                "Seat is currently held by another user.");
        }

        bool alreadyBooked;

        try
        {
            alreadyBooked =
                await _bookingRepository.IsSeatBookedAsync(
                    showtimeId,
                    seatId);
        }
        catch
        {
            await _seatHoldService.ReleaseAsync(
                showtimeId,
                seatId,
                holderId);

            throw;
        }

        if (alreadyBooked)
        {
            await _seatHoldService.ReleaseAsync(
                showtimeId,
                seatId,
                holderId);

            throw new ConflictException("Seat is already booked.");
        }
    }
}
