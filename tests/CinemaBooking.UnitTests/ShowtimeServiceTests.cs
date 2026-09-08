using CinemaBooking.Modules.Catalog.Contracts;
using CinemaBooking.Modules.Scheduling.Application.Interfaces;
using CinemaBooking.Modules.Scheduling.Application.Showtimes;
using CinemaBooking.Modules.Scheduling.Domain;
using CinemaBooking.Modules.Theater.Contracts;
using CinemaBooking.SharedKernel.Exceptions;

namespace CinemaBooking.UnitTests;

public class ShowtimeServiceTests
{
    private static readonly Guid MovieId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid RoomId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [Fact]
    public async Task CreateAsync_rejects_standard_price_higher_than_vip()
    {
        var service = CreateService();

        var exception = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.CreateAsync(new CreateShowtimeRequest
            {
                MovieId = MovieId,
                RoomId = RoomId,
                StartTime = DateTime.UtcNow.AddDays(1),
                BasePrice = 120000m,
                StandardPrice = 120000m,
                VipPrice = 100000m,
                CouplePrice = 200000m
            }));

        Assert.Equal(
            "Seat prices must be ordered Standard <= VIP <= Couple.",
            exception.Message);
    }

    [Fact]
    public async Task BulkCreateAsync_rejects_vip_price_higher_than_couple()
    {
        var service = CreateService();

        var exception = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.BulkCreateAsync(new BulkCreateShowtimesRequest
            {
                MovieId = MovieId,
                RoomId = RoomId,
                StartTimes = [DateTime.UtcNow.AddDays(1)],
                BasePrice = 90000m,
                StandardPrice = 90000m,
                VipPrice = 250000m,
                CouplePrice = 200000m
            }));

        Assert.Equal(
            "Seat prices must be ordered Standard <= VIP <= Couple.",
            exception.Message);
    }

    [Fact]
    public async Task CreateAsync_preserves_valid_seat_prices()
    {
        var repository = new FakeShowtimeRepository();
        var service = CreateService(repository);

        var response = await service.CreateAsync(new CreateShowtimeRequest
        {
            MovieId = MovieId,
            RoomId = RoomId,
            StartTime = DateTime.UtcNow.AddDays(1),
            BasePrice = 91000m,
            StandardPrice = 91000m,
            VipPrice = 111000m,
            CouplePrice = 211000m
        });

        var showtime = Assert.Single(repository.Showtimes);
        Assert.Equal(91000m, response.BasePrice);
        Assert.Equal(91000m, response.StandardPrice);
        Assert.Equal(111000m, response.VipPrice);
        Assert.Equal(211000m, response.CouplePrice);
        Assert.Equal(91000m, showtime.StandardPrice);
        Assert.Equal(111000m, showtime.VipPrice);
        Assert.Equal(211000m, showtime.CouplePrice);
    }

    private static ShowtimeService CreateService(
        FakeShowtimeRepository? repository = null)
    {
        return new ShowtimeService(
            repository ?? new FakeShowtimeRepository(),
            new FakeCatalogModule(),
            new FakeTheaterModule());
    }

    private sealed class FakeShowtimeRepository : IShowtimeRepository
    {
        public List<Showtime> Showtimes { get; } = [];

        public Task AddAsync(
            Showtime showtime,
            CancellationToken cancellationToken = default)
        {
            Showtimes.Add(showtime);

            return Task.CompletedTask;
        }

        public Task AddRangeAsync(
            IReadOnlyCollection<Showtime> showtimes,
            CancellationToken cancellationToken = default)
        {
            Showtimes.AddRange(showtimes);

            return Task.CompletedTask;
        }

        public Task<Showtime?> GetByIdAsync(Guid id)
        {
            return Task.FromResult(
                Showtimes.FirstOrDefault(showtime => showtime.Id == id));
        }

        public Task<List<Showtime>> GetAllAsync()
        {
            return Task.FromResult(Showtimes);
        }

        public Task<bool> HasOverlappingShowtimeAsync(
            Guid roomId,
            DateTime startTime,
            DateTime endTime,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(false);
        }

        public Task<IReadOnlyList<Showtime>> GetOverlappingAsync(
            Guid roomId,
            DateTime rangeStart,
            DateTime rangeEnd,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<Showtime>>([]);
        }

        public Task<TResult> ExecuteInSerializableTransactionAsync<TResult>(
            Func<CancellationToken, Task<TResult>> action,
            CancellationToken cancellationToken = default)
        {
            return action(cancellationToken);
        }
    }

    private sealed class FakeCatalogModule : ICatalogModule
    {
        public Task<bool> MovieExistsAsync(Guid movieId)
        {
            return Task.FromResult(movieId == MovieId);
        }

        public Task<MovieInfo?> GetMovieAsync(
            Guid movieId,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult<MovieInfo?>(
                movieId == MovieId
                    ? new MovieInfo(
                        MovieId,
                        "Test Movie",
                        "Description",
                        120,
                        DateTime.UtcNow.Date,
                        null,
                        null,
                        null,
                        null,
                        null,
                        true)
                    : null);
        }

        public Task<IReadOnlyList<MovieInfo>> GetMoviesByIdsAsync(
            IReadOnlyCollection<Guid> movieIds,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<MovieInfo>>([]);
        }
    }

    private sealed class FakeTheaterModule : ITheaterModule
    {
        public Task<bool> CinemaExistsAsync(
            Guid cinemaId,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(true);
        }

        public Task<CinemaInfo?> GetCinemaAsync(
            Guid cinemaId,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult<CinemaInfo?>(null);
        }

        public Task<IReadOnlyList<CinemaInfo>> GetCinemasAsync(
            string? provinceCode = null,
            string? wardCode = null,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<CinemaInfo>>([]);
        }

        public Task<IReadOnlyList<CinemaInfo>> GetCinemasByIdsAsync(
            IReadOnlyCollection<Guid> cinemaIds,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<CinemaInfo>>([]);
        }

        public Task<CinemaInfo> CreateCinemaAsync(
            string name,
            string address,
            string city,
            string? description,
            string? imageUrl = null,
            string? provinceCode = null,
            string? provinceName = null,
            string? wardCode = null,
            string? wardName = null,
            string? addressLine = null,
            CancellationToken cancellationToken = default)
        {
            throw new NotSupportedException();
        }

        public Task UpdateCinemaAsync(
            Guid cinemaId,
            string name,
            string address,
            string city,
            string? description,
            string? imageUrl,
            bool isActive,
            string? provinceCode = null,
            string? provinceName = null,
            string? wardCode = null,
            string? wardName = null,
            string? addressLine = null,
            CancellationToken cancellationToken = default)
        {
            throw new NotSupportedException();
        }

        public Task<RoomInfo?> GetRoomAsync(
            Guid roomId,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult<RoomInfo?>(
                roomId == RoomId
                    ? new RoomInfo(RoomId, Guid.NewGuid(), "Room 1", true)
                    : null);
        }

        public Task<IReadOnlyList<RoomInfo>> GetRoomsByCinemaAsync(
            Guid cinemaId,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<RoomInfo>>([]);
        }

        public Task<bool> RoomExistsAsync(
            Guid roomId,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(roomId == RoomId);
        }

        public Task<bool> SeatBelongsToRoomAsync(
            Guid seatId,
            Guid roomId,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(true);
        }

        public Task<IReadOnlyList<SeatInfo>> GetSeatsByRoomAsync(
            Guid roomId,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<SeatInfo>>([]);
        }
    }
}
