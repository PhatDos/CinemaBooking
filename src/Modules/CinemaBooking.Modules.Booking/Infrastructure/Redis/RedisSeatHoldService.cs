using CinemaBooking.Modules.Booking.Application.Interfaces;
using StackExchange.Redis;

namespace CinemaBooking.Modules.Booking.Infrastructure.Redis;

public class RedisSeatHoldService : ISeatHoldService
{
    private readonly IDatabase _database;

    public RedisSeatHoldService(IConnectionMultiplexer redis)
    {
        _database = redis.GetDatabase();
    }

    public async Task<bool> HoldAsync(
        Guid showtimeId,
        Guid seatId,
        Guid holderId,
        TimeSpan duration)
    {
        var key = GetKey(showtimeId, seatId);

        return await _database.StringSetAsync(
            key,
            holderId.ToString(),
            duration,
            when: When.NotExists);
    }

    public async Task<bool> IsHeldByAsync(
        Guid showtimeId,
        Guid seatId,
        Guid holderId)
    {
        var key = GetKey(showtimeId, seatId);

        var value =
            await _database.StringGetAsync(key);

        return value.HasValue &&
               value.ToString() == holderId.ToString();
    }

    public async Task<bool> IsHeldAsync(
        Guid showtimeId,
        Guid seatId)
    {
        var key = GetKey(showtimeId, seatId);

        return await _database.KeyExistsAsync(key);
    }

    public async Task<HashSet<Guid>> GetHeldSeatIdsAsync(
        Guid showtimeId,
        IReadOnlyCollection<Guid> seatIds)
    {
        var tasks = seatIds
            .Select(async seatId =>
            {
                var key = GetKey(showtimeId, seatId);

                var exists =
                    await _database.KeyExistsAsync(key);

                return new
                {
                    SeatId = seatId,
                    Exists = exists
                };
            });

        var results = await Task.WhenAll(tasks);

        return results
            .Where(result => result.Exists)
            .Select(result => result.SeatId)
            .ToHashSet();
    }

    public async Task ReleaseAsync(
        Guid showtimeId,
        Guid seatId,
        Guid holderId)
    {
        var key = GetKey(showtimeId, seatId);

        var value =
            await _database.StringGetAsync(key);

        if (value.HasValue &&
            value.ToString() == holderId.ToString())
        {
            await _database.KeyDeleteAsync(key);
        }
    }

    private static string GetKey(
        Guid showtimeId,
        Guid seatId)
    {
        return $"seat-hold:{showtimeId}:{seatId}";
    }
}
