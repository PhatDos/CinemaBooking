using CinemaBooking.Modules.Booking.Domain;
using CinemaBooking.Modules.Booking.Infrastructure.Persistence;
using CinemaBooking.Modules.Booking.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using BookingEntity = CinemaBooking.Modules.Booking.Domain.Booking;

namespace CinemaBooking.UnitTests;

public class BookingRepositoryTests
{
    [Fact]
    public async Task GetSeatStatusesAsync_ReturnsOnlyActiveReservations()
    {
        await using var dbContext = CreateDbContext();
        var repository = new BookingRepository(dbContext);
        var showtimeId = Guid.NewGuid();
        var activeSeatId = Guid.NewGuid();
        var releasedSeatId = Guid.NewGuid();
        var cancelledSeatId = Guid.NewGuid();

        dbContext.Bookings.AddRange(
            CreateBooking(
                showtimeId,
                BookingStatus.Pending,
                CreateSeat(showtimeId, activeSeatId)),
            CreateBooking(
                showtimeId,
                BookingStatus.Expired,
                CreateSeat(
                    showtimeId,
                    releasedSeatId,
                    DateTime.UtcNow)),
            CreateBooking(
                showtimeId,
                BookingStatus.Cancelled,
                CreateSeat(showtimeId, cancelledSeatId)));

        await dbContext.SaveChangesAsync();

        var statuses =
            await repository.GetSeatStatusesAsync(showtimeId);

        var status = Assert.Single(statuses);
        Assert.Equal(activeSeatId, status.SeatId);
        Assert.Equal(BookingStatus.Pending, status.BookingStatus);
    }

    [Fact]
    public async Task IsSeatBookedAsync_IgnoresReleasedSeats()
    {
        await using var dbContext = CreateDbContext();
        var repository = new BookingRepository(dbContext);
        var showtimeId = Guid.NewGuid();
        var seatId = Guid.NewGuid();

        dbContext.Bookings.Add(
            CreateBooking(
                showtimeId,
                BookingStatus.Expired,
                CreateSeat(
                    showtimeId,
                    seatId,
                    DateTime.UtcNow)));

        await dbContext.SaveChangesAsync();

        var booked =
            await repository.IsSeatBookedAsync(
                showtimeId,
                seatId);

        Assert.False(booked);
    }

    private static BookingDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new BookingDbContext(options);
    }

    private static BookingEntity CreateBooking(
        Guid showtimeId,
        BookingStatus status,
        params BookingSeat[] seats)
    {
        var booking = new BookingEntity
        {
            UserId = Guid.NewGuid(),
            ShowtimeId = showtimeId,
            Status = status,
            TotalAmount = seats.Sum(seat => seat.Price),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = status == BookingStatus.Pending
                ? DateTime.UtcNow.AddMinutes(5)
                : null,
            Seats = seats.ToList()
        };

        foreach (var seat in seats)
        {
            seat.Booking = booking;
        }

        return booking;
    }

    private static BookingSeat CreateSeat(
        Guid showtimeId,
        Guid seatId,
        DateTime? releasedAt = null)
    {
        return new BookingSeat
        {
            ShowtimeId = showtimeId,
            SeatId = seatId,
            Price = 100,
            ReleasedAt = releasedAt
        };
    }
}
