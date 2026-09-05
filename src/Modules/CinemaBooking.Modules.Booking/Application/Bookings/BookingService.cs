using CinemaBooking.Modules.Booking.Application.Interfaces;
using CinemaBooking.Modules.Booking.Application.Pricing;
using CinemaBooking.Modules.Booking.Contracts;
using CinemaBooking.Modules.Booking.Domain;
using CinemaBooking.Modules.Scheduling.Contracts;
using CinemaBooking.Modules.Theater.Contracts;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using BookingEntity = CinemaBooking.Modules.Booking.Domain.Booking;

namespace CinemaBooking.Modules.Booking.Application.Bookings;

public class BookingService
{
    private static readonly TimeSpan HoldTransitionLease =
        TimeSpan.FromSeconds(30);

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
        return await CreateAsync(userId, request.HoldId);
    }

    public async Task<BookingResponse> CreateAsync(
        Guid userId,
        Guid holdId)
    {
        if (userId == Guid.Empty)
        {
            throw new BusinessRuleException("User id is required.");
        }

        if (holdId == Guid.Empty)
        {
            throw new BusinessRuleException("Hold id is required.");
        }

        var existingBooking =
            await _repository.GetByHoldIdAsync(holdId);

        if (existingBooking is not null)
        {
            if (existingBooking.UserId != userId)
            {
                throw new ConflictException(
                    "Seat hold does not belong to the current user.");
            }

            return ToResponse(existingBooking);
        }

        var hold =
            await _seatHoldService.GetHoldAsync(holdId);

        if (hold is null)
        {
            throw new ConflictException(
                "Seat hold does not exist or has expired.");
        }

        if (hold.UserId != userId)
        {
            throw new ConflictException(
                "Seat hold does not belong to the current user.");
        }

        if (hold.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            throw new ConflictException("Seat hold has expired.");
        }

        var showtime =
            await _schedulingModule.GetShowtimeAsync(hold.ShowtimeId);

        if (showtime is null)
        {
            throw new NotFoundException("Showtime not found.");
        }

        var stillOwned =
            await _seatHoldService.VerifyAndExtendAsync(
                hold,
                HoldTransitionLease);

        if (!stillOwned)
        {
            throw new ConflictException(
                "Seat hold is no longer valid.");
        }

        var seatIds = hold.SeatIds
            .Distinct()
            .ToList();

        var roomSeats =
            await _theaterModule.GetSeatsByRoomAsync(showtime.RoomId);

        var roomSeatsById =
            roomSeats.ToDictionary(seat => seat.Id);

        foreach (var seatId in seatIds)
        {
            if (!roomSeatsById.ContainsKey(seatId))
            {
                throw new BusinessRuleException(
                    $"Seat {seatId} does not belong to the showtime room.");
            }
        }

        var now = DateTime.UtcNow;

        var booking = new BookingEntity
        {
            UserId = userId,
            ShowtimeId = hold.ShowtimeId,
            HoldId = hold.HoldId,
            Status = BookingStatus.Pending,
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(5)
        };

        foreach (var seatId in seatIds)
        {
            var seat = roomSeatsById[seatId];

            booking.Seats.Add(new BookingSeat
            {
                ShowtimeId = hold.ShowtimeId,
                SeatId = seatId,
                Price = SeatPricing.Calculate(
                    showtime.BasePrice,
                    seat.Type)
            });
        }

        booking.TotalAmount =
            booking.Seats.Sum(seat => seat.Price);

        try
        {
            await _repository.AddAsync(booking);
        }
        catch (DbUpdateException ex)
        {
            var bookingFromRetry =
                await _repository.GetByHoldIdAsync(hold.HoldId);

            if (bookingFromRetry is not null &&
                bookingFromRetry.UserId == userId)
            {
                return ToResponse(bookingFromRetry);
            }

            if (IsUniqueViolation(ex))
            {
                await _seatHoldService.ReleaseAsync(hold);

                throw new ConflictException(
                    "One or more seats are already booked.");
            }

            throw;
        }

        await _seatHoldService.ReleaseAsync(hold);

        return ToResponse(booking);
    }

    public async Task<BookingResponse> CreateConfirmedAsync(
        Guid userId,
        Guid holdId,
        Guid showtimeId,
        IReadOnlyCollection<CreateConfirmedBookingSeat> seats)
    {
        if (userId == Guid.Empty)
        {
            throw new BusinessRuleException("User id is required.");
        }

        if (holdId == Guid.Empty)
        {
            throw new BusinessRuleException("Hold id is required.");
        }

        if (showtimeId == Guid.Empty)
        {
            throw new BusinessRuleException("Showtime id is required.");
        }

        if (seats.Count == 0)
        {
            throw new BusinessRuleException(
                "At least one seat is required.");
        }

        var existingBooking =
            await _repository.GetByHoldIdAsync(holdId);

        if (existingBooking is not null)
        {
            if (existingBooking.UserId != userId)
            {
                throw new ConflictException(
                    "Seat hold does not belong to the current user.");
            }

            return ToResponse(existingBooking);
        }

        var distinctSeats = seats
            .GroupBy(seat => seat.SeatId)
            .Select(group => group.First())
            .ToList();

        if (distinctSeats.Count != seats.Count)
        {
            throw new BusinessRuleException(
                "Duplicate seats are not allowed.");
        }

        var now = DateTime.UtcNow;

        var booking = new BookingEntity
        {
            UserId = userId,
            ShowtimeId = showtimeId,
            HoldId = holdId,
            Status = BookingStatus.Confirmed,
            CreatedAt = now,
            ExpiresAt = null
        };

        foreach (var seat in distinctSeats)
        {
            booking.Seats.Add(new BookingSeat
            {
                ShowtimeId = showtimeId,
                SeatId = seat.SeatId,
                Price = seat.Price
            });
        }

        booking.TotalAmount =
            booking.Seats.Sum(seat => seat.Price);

        try
        {
            await _repository.AddAsync(booking);
        }
        catch (DbUpdateException ex)
        {
            var bookingFromRetry =
                await _repository.GetByHoldIdAsync(holdId);

            if (bookingFromRetry is not null &&
                bookingFromRetry.UserId == userId)
            {
                return ToResponse(bookingFromRetry);
            }

            if (IsUniqueViolation(ex))
            {
                throw new ConflictException(
                    "One or more seats are already booked.");
            }

            throw;
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

        var now = DateTime.UtcNow;

        foreach (var seat in booking.Seats.Where(seat => seat.ReleasedAt is null))
        {
            seat.ReleasedAt = now;
        }

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
            HoldId = booking.HoldId,
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

    private static bool IsUniqueViolation(DbUpdateException exception)
    {
        return exception.InnerException is SqlException sqlException &&
               sqlException.Errors
                   .Cast<SqlError>()
                   .Any(error => error.Number is 2601 or 2627);
    }
}
