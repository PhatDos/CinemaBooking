using CinemaBooking.Modules.Booking.Application.Interfaces;
using CinemaBooking.Modules.Booking.Domain;
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

        var seatStatusesTask =
            _bookingRepository.GetSeatStatusesAsync(showtimeId);

        var heldTask =
            _seatHoldService.GetHeldSeatIdsAsync(
                showtimeId,
                seatIds);

        await Task.WhenAll(seatStatusesTask, heldTask);

        var seatStatuses = await seatStatusesTask;
        var heldSeatIds = await heldTask;
        var statusBySeat = seatStatuses.ToDictionary(
            seat => seat.SeatId,
            seat => seat.BookingStatus);

        return seats
            .Select(seat => new SeatAvailabilityResponse
            {
                SeatId = seat.Id,
                Row = seat.Row,
                Number = seat.Number,
                Type = seat.Type,
                Status = GetSeatStatus(
                    seat.Id,
                    statusBySeat,
                    heldSeatIds)
            })
            .ToList();
    }

    private static SeatStatus GetSeatStatus(
        Guid seatId,
        IReadOnlyDictionary<Guid, BookingStatus> statusBySeat,
        IReadOnlySet<Guid> heldSeatIds)
    {
        if (statusBySeat.TryGetValue(
            seatId,
            out var bookingStatus))
        {
            return bookingStatus switch
            {
                BookingStatus.Pending => SeatStatus.Reserved,
                BookingStatus.Confirmed => SeatStatus.Booked,
                _ => SeatStatus.Available
            };
        }

        return heldSeatIds.Contains(seatId)
            ? SeatStatus.Held
            : SeatStatus.Available;
    }
}
