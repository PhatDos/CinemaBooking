using CinemaBooking.Modules.Booking.Application;
using CinemaBooking.Modules.Booking.Application.Interfaces;
using CinemaBooking.Modules.Booking.Domain;
using BookingEntity = CinemaBooking.Modules.Booking.Domain.Booking;

namespace CinemaBooking.UnitTests;

public class BookingExpirationServiceTests
{
    [Fact]
    public async Task ExpireBookingsAsync_ExpiresPendingBookingsAndRemovesSeats()
    {
        var seat = new BookingSeat
        {
            ShowtimeId = Guid.NewGuid(),
            SeatId = Guid.NewGuid(),
            Price = 100
        };

        var booking = new BookingEntity
        {
            Status = BookingStatus.Pending,
            ExpiresAt = DateTime.UtcNow.AddMinutes(-1),
            Seats = new List<BookingSeat> { seat }
        };

        var repository = new FakeBookingRepository(
            new List<BookingEntity> { booking });

        var service = new BookingExpirationService(repository);

        await service.ExpireBookingsAsync();

        Assert.Equal(BookingStatus.Expired, booking.Status);
        Assert.Contains(seat, repository.RemovedSeats);
        Assert.True(repository.SaveChangesCalled);
    }

    [Fact]
    public async Task ExpireBookingsAsync_DoesNotSaveWhenNoBookingsExpired()
    {
        var repository = new FakeBookingRepository(new List<BookingEntity>());
        var service = new BookingExpirationService(repository);

        await service.ExpireBookingsAsync();

        Assert.False(repository.SaveChangesCalled);
    }

    private sealed class FakeBookingRepository : IBookingRepository
    {
        private readonly List<BookingEntity> _expiredBookings;

        public FakeBookingRepository(List<BookingEntity> expiredBookings)
        {
            _expiredBookings = expiredBookings;
        }

        public List<BookingSeat> RemovedSeats { get; } = [];

        public bool SaveChangesCalled { get; private set; }

        public Task AddAsync(BookingEntity booking)
        {
            throw new NotImplementedException();
        }

        public Task<BookingEntity?> GetByIdAsync(Guid id)
        {
            throw new NotImplementedException();
        }

        public Task<BookingEntity?> GetForUpdateAsync(Guid id)
        {
            throw new NotImplementedException();
        }

        public Task<List<BookingEntity>> GetAllAsync()
        {
            throw new NotImplementedException();
        }

        public Task<List<BookingEntity>> GetByUserIdAsync(Guid userId)
        {
            throw new NotImplementedException();
        }

        public Task<List<BookingEntity>> GetExpiredPendingBookingsAsync(
            DateTime utcNow)
        {
            return Task.FromResult(_expiredBookings);
        }

        public Task<bool> IsSeatBookedAsync(
            Guid showtimeId,
            Guid seatId)
        {
            throw new NotImplementedException();
        }

        public Task<HashSet<Guid>> GetBookedSeatIdsAsync(Guid showtimeId)
        {
            throw new NotImplementedException();
        }

        public void RemoveSeats(IEnumerable<BookingSeat> seats)
        {
            RemovedSeats.AddRange(seats);
        }

        public Task SaveChangesAsync()
        {
            SaveChangesCalled = true;

            return Task.CompletedTask;
        }
    }
}
