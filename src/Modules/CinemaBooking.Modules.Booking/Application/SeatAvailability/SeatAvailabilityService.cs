using CinemaBooking.Modules.Booking.Application.Interfaces;
using CinemaBooking.Modules.Scheduling.Contracts;
using CinemaBooking.Modules.Theater.Contracts;
using CinemaBooking.SharedKernel.Exceptions;

namespace CinemaBooking.Modules.Booking.Application.SeatAvailability;

public class SeatAvailabilityService
{
    private readonly ISchedulingModule _schedulingModule;
    private readonly ITheaterModule _theaterModule;
    private readonly IBookingRepository _bookingRepository;
    private readonly ISeatHoldService _seatHoldService;

    public SeatAvailabilityService(
        ISchedulingModule schedulingModule,
        ITheaterModule theaterModule,
        IBookingRepository bookingRepository,
        ISeatHoldService seatHoldService)
    {
        _schedulingModule = schedulingModule;
        _theaterModule = theaterModule;
        _bookingRepository = bookingRepository;
        _seatHoldService = seatHoldService;
    }

    public async Task<List<SeatAvailabilityResponse>> GetAsync(
        Guid showtimeId)
    {
        var showtime =
            await _schedulingModule.GetShowtimeAsync(showtimeId);

        if (showtime is null)
        {
            throw new NotFoundException("Showtime not found.");
        }

        var seats =
            await _theaterModule.GetSeatsByRoomAsync(showtime.RoomId);

        var seatIds = seats
            .Select(seat => seat.Id)
            .ToList();

        var bookedTask =
            _bookingRepository.GetBookedSeatIdsAsync(showtimeId);

        var heldTask =
            _seatHoldService.GetHeldSeatIdsAsync(
                showtimeId,
                seatIds);

        await Task.WhenAll(bookedTask, heldTask);

        var bookedSeatIds = await bookedTask;
        var heldSeatIds = await heldTask;

        return seats
            .Select(seat => new SeatAvailabilityResponse
            {
                SeatId = seat.Id,
                Row = seat.Row,
                Number = seat.Number,
                Status = bookedSeatIds.Contains(seat.Id)
                    ? SeatStatus.Booked
                    : heldSeatIds.Contains(seat.Id)
                        ? SeatStatus.Held
                        : SeatStatus.Available
            })
            .ToList();
    }
}
