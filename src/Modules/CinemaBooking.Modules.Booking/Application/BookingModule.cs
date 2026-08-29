using CinemaBooking.Modules.Booking.Contracts;
using CinemaBooking.Modules.Booking.Domain;
using CinemaBooking.Modules.Booking.Infrastructure.Persistence;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.Modules.Booking.Application;

public class BookingModule : IBookingModule
{
    private readonly BookingDbContext _dbContext;

    public BookingModule(BookingDbContext dbContext)
    {
        _dbContext = dbContext;
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
}
