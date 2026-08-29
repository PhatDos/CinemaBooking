using CinemaBooking.Modules.Booking.Application.Interfaces;
using CinemaBooking.Modules.Booking.Domain;
using CinemaBooking.Modules.Scheduling.Contracts;
using CinemaBooking.Modules.Theater.Contracts;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.EntityFrameworkCore;
using BookingEntity = CinemaBooking.Modules.Booking.Domain.Booking;

namespace CinemaBooking.Modules.Booking.Application.Bookings;

public class BookingService
{
    private readonly IBookingRepository _repository;
    private readonly ISeatHoldService _seatHoldService;
    private readonly ISchedulingModule _schedulingModule;
    private readonly ITheaterModule _theaterModule;

    public BookingService(
        IBookingRepository repository,
        ISeatHoldService seatHoldService,
        ISchedulingModule schedulingModule,
        ITheaterModule theaterModule)
    {
        _repository = repository;
        _seatHoldService = seatHoldService;
        _schedulingModule = schedulingModule;
        _theaterModule = theaterModule;
    }

    public async Task<BookingResponse> CreateAsync(
        Guid userId,
        CreateBookingRequest request)
    {
        if (userId == Guid.Empty)
        {
            throw new BusinessRuleException("User id is required.");
        }

        var seatIds = request.SeatIds
            .Distinct()
            .ToList();

        if (seatIds.Count != request.SeatIds.Count)
        {
            throw new BusinessRuleException(
                "Duplicate seats are not allowed.");
        }

        var showtime =
            await _schedulingModule.GetShowtimeAsync(request.ShowtimeId);

        if (showtime is null)
        {
            throw new NotFoundException("Showtime not found.");
        }

        foreach (var seatId in seatIds)
        {
            var validSeat =
                await _theaterModule.SeatBelongsToRoomAsync(
                    seatId,
                    showtime.RoomId);

            if (!validSeat)
            {
                throw new BusinessRuleException(
                    $"Seat {seatId} does not belong to the showtime room.");
            }

            var heldByUser =
                await _seatHoldService.IsHeldByAsync(
                    request.ShowtimeId,
                    seatId,
                    userId);

            if (!heldByUser)
            {
                throw new ConflictException(
                    $"Seat {seatId} is not held by this user.");
            }
        }

        var now = DateTime.UtcNow;

        var booking = new BookingEntity
        {
            UserId = userId,
            ShowtimeId = request.ShowtimeId,
            Status = BookingStatus.Pending,
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(5)
        };

        foreach (var seatId in seatIds)
        {
            booking.Seats.Add(new BookingSeat
            {
                ShowtimeId = request.ShowtimeId,
                SeatId = seatId,
                Price = showtime.BasePrice
            });
        }

        booking.TotalAmount =
            booking.Seats.Sum(seat => seat.Price);

        try
        {
            await _repository.AddAsync(booking);
        }
        catch (DbUpdateException)
        {
            foreach (var seatId in seatIds)
            {
                await _seatHoldService.ReleaseAsync(
                    request.ShowtimeId,
                    seatId,
                    userId);
            }

            throw new ConflictException(
                "One or more seats are already booked.");
        }

        foreach (var seatId in seatIds)
        {
            await _seatHoldService.ReleaseAsync(
                request.ShowtimeId,
                seatId,
                userId);
        }

        return ToResponse(booking);
    }

    public async Task CancelAsync(Guid userId, Guid bookingId)
    {
        if (userId == Guid.Empty)
        {
            throw new BusinessRuleException("User id is required.");
        }

        var booking =
            await _repository.GetForUpdateAsync(bookingId);

        if (booking is null || booking.UserId != userId)
        {
            throw new NotFoundException("Booking not found.");
        }

        if (booking.Status != BookingStatus.Pending)
        {
            throw new BusinessRuleException(
                "Only pending bookings can be cancelled.");
        }

        var seats = booking.Seats.ToList();

        _repository.RemoveSeats(seats);

        booking.Status = BookingStatus.Cancelled;

        await _repository.SaveChangesAsync();
    }

    public async Task<BookingResponse?> GetByIdAsync(Guid id)
    {
        var booking = await _repository.GetByIdAsync(id);

        return booking is null
            ? null
            : ToResponse(booking);
    }

    public async Task<List<BookingResponse>> GetAllAsync()
    {
        var bookings = await _repository.GetAllAsync();

        return bookings
            .Select(ToResponse)
            .ToList();
    }

    public async Task<List<BookingResponse>> GetByUserIdAsync(Guid userId)
    {
        var bookings =
            await _repository.GetByUserIdAsync(userId);

        return bookings
            .Select(ToResponse)
            .ToList();
    }

    private static BookingResponse ToResponse(BookingEntity booking)
    {
        return new BookingResponse
        {
            Id = booking.Id,
            UserId = booking.UserId,
            ShowtimeId = booking.ShowtimeId,
            Status = booking.Status,
            TotalAmount = booking.TotalAmount,
            SeatIds = booking.Seats
                .Select(seat => seat.SeatId)
                .ToList(),
            Seats = booking.Seats
                .Select(seat => new BookingSeatResponse
                {
                    SeatId = seat.SeatId,
                    Price = seat.Price
                })
                .ToList(),
            CreatedAt = booking.CreatedAt,
            ExpiresAt = booking.ExpiresAt
        };
    }
}
