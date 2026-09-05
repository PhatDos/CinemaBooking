using System.Text.Json;
using CinemaBooking.Modules.Booking.Application.Interfaces;
using CinemaBooking.Modules.Booking.Application.SeatHolds;
using StackExchange.Redis;

namespace CinemaBooking.Modules.Booking.Infrastructure.Redis;

public class RedisSeatHoldService : ISeatHoldService
{
    private const string HoldManyScript = """
        for i = 1, #KEYS - 1 do
            if redis.call('EXISTS', KEYS[i]) == 1 then
                return 0
            end
        end

        for i = 1, #KEYS - 1 do
            redis.call('SET', KEYS[i], ARGV[1], 'PX', ARGV[2])
        end

        redis.call('SET', KEYS[#KEYS], ARGV[3], 'PX', ARGV[2])

        return 1
        """;

    private const string VerifyAndExtendScript = """
        for i = 1, #KEYS - 1 do
            local current = redis.call('GET', KEYS[i])

            if current ~= ARGV[1] then
                return 0
            end
        end

        if redis.call('EXISTS', KEYS[#KEYS]) == 0 then
            return 0
        end

        for i = 1, #KEYS do
            redis.call('PEXPIRE', KEYS[i], ARGV[2])
        end

        return 1
        """;

    private const string ReleaseHoldScript = """
        for i = 1, #KEYS - 1 do
            local current = redis.call('GET', KEYS[i])

            if current ~= ARGV[1] then
                return 0
            end
        end

        for i = 1, #KEYS do
            redis.call('DEL', KEYS[i])
        end

        return 1
        """;

    private const string ReleaseIfValueMatchesScript = """
        if redis.call('GET', KEYS[1]) == ARGV[1] then
            return redis.call('DEL', KEYS[1])
        end

        return 0
        """;

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
        var hold = new SeatHoldMetadata(
            Guid.NewGuid(),
            holderId,
            showtimeId,
            [seatId],
            DateTimeOffset.UtcNow.Add(duration));

        return await HoldManyAsync(hold);
    }

    public async Task<bool> HoldManyAsync(SeatHoldMetadata hold)
    {
        var seatIds = hold.SeatIds
            .Distinct()
            .ToArray();

        if (seatIds.Length == 0)
        {
            return false;
        }

        var ttl = hold.ExpiresAt - DateTimeOffset.UtcNow;

        if (ttl <= TimeSpan.Zero)
        {
            return false;
        }

        var keys = BuildHoldKeys(hold.ShowtimeId, hold.HoldId, seatIds);
        var values = new RedisValue[]
        {
            hold.HoldId.ToString(),
            (long)ttl.TotalMilliseconds,
            JsonSerializer.Serialize(hold)
        };

        var result =
            await _database.ScriptEvaluateAsync(
                HoldManyScript,
                keys,
                values);

        var acquired = (int)result == 1;

        if (acquired)
        {
            await _database.StringSetAsync(
                GetHoldIndexKey(hold.HoldId),
                hold.ShowtimeId.ToString(),
                ttl);
        }

        return acquired;
    }

    public async Task<SeatHoldMetadata?> GetHoldAsync(Guid holdId)
    {
        var showtimeIdValue =
            await _database.StringGetAsync(
                GetHoldIndexKey(holdId));

        if (!showtimeIdValue.HasValue ||
            !Guid.TryParse(showtimeIdValue.ToString(), out var showtimeId))
        {
            return null;
        }

        var metadata =
            await _database.StringGetAsync(
                GetMetadataKey(showtimeId, holdId));

        if (!metadata.HasValue)
        {
            return null;
        }

        return JsonSerializer.Deserialize<SeatHoldMetadata>(
            metadata.ToString());
    }

    public async Task<bool> VerifyAndExtendAsync(
        SeatHoldMetadata hold,
        TimeSpan duration)
    {
        if (duration <= TimeSpan.Zero)
        {
            return false;
        }

        var seatIds = hold.SeatIds
            .Distinct()
            .ToArray();

        if (seatIds.Length == 0)
        {
            return false;
        }

        var result =
            await _database.ScriptEvaluateAsync(
                VerifyAndExtendScript,
                BuildHoldKeys(hold.ShowtimeId, hold.HoldId, seatIds),
                [
                    hold.HoldId.ToString(),
                    (long)duration.TotalMilliseconds
                ]);

        var extended = (int)result == 1;

        if (extended)
        {
            await _database.KeyExpireAsync(
                GetHoldIndexKey(hold.HoldId),
                duration);
        }

        return extended;
    }

    public async Task<bool> ExtendAsync(
        SeatHoldMetadata hold,
        DateTimeOffset expiresAt)
    {
        var ttl = expiresAt - DateTimeOffset.UtcNow;

        if (ttl <= TimeSpan.Zero)
        {
            return false;
        }

        var extended =
            await VerifyAndExtendAsync(
                hold,
                ttl);

        if (!extended)
        {
            return false;
        }

        var updatedHold = hold with
        {
            ExpiresAt = expiresAt
        };

        await _database.StringSetAsync(
            GetMetadataKey(hold.ShowtimeId, hold.HoldId),
            JsonSerializer.Serialize(updatedHold),
            ttl);

        await _database.KeyExpireAsync(
            GetHoldIndexKey(hold.HoldId),
            ttl);

        return true;
    }

    public async Task<bool> IsHeldByAsync(
        Guid showtimeId,
        Guid seatId,
        Guid holderId)
    {
        var key = GetSeatKey(showtimeId, seatId);

        var value =
            await _database.StringGetAsync(key);

        if (!value.HasValue)
        {
            return false;
        }

        if (Guid.TryParse(value.ToString(), out var holdId))
        {
            var hold = await GetHoldAsync(holdId);

            return hold?.UserId == holderId;
        }

        return IsLegacyHoldBy(value.ToString(), holderId);
    }

    public async Task<bool> IsHeldAsync(
        Guid showtimeId,
        Guid seatId)
    {
        var key = GetSeatKey(showtimeId, seatId);

        return await _database.KeyExistsAsync(key);
    }

    public async Task<HashSet<Guid>> GetHeldSeatIdsAsync(
        Guid showtimeId,
        IReadOnlyCollection<Guid> seatIds)
    {
        var tasks = seatIds
            .Select(async seatId =>
            {
                var key = GetSeatKey(showtimeId, seatId);

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
        var key = GetSeatKey(showtimeId, seatId);

        var value =
            await _database.StringGetAsync(key);

        if (!value.HasValue)
        {
            return;
        }

        if (Guid.TryParse(value.ToString(), out var holdId))
        {
            var hold = await GetHoldAsync(holdId);

            if (hold?.UserId == holderId)
            {
                await ReleaseAsync(hold);
            }

            return;
        }

        if (IsLegacyHoldBy(value.ToString(), holderId))
        {
            await _database.ScriptEvaluateAsync(
                ReleaseIfValueMatchesScript,
                [(RedisKey)key],
                [value]);
        }
    }

    public async Task<bool> ReleaseAsync(SeatHoldMetadata hold)
    {
        var seatIds = hold.SeatIds
            .Distinct()
            .ToArray();

        if (seatIds.Length == 0)
        {
            return false;
        }

        var result =
            await _database.ScriptEvaluateAsync(
                ReleaseHoldScript,
                BuildHoldKeys(hold.ShowtimeId, hold.HoldId, seatIds),
                [hold.HoldId.ToString()]);

        var released = (int)result == 1;

        if (released)
        {
            await _database.KeyDeleteAsync(
                GetHoldIndexKey(hold.HoldId));
        }

        return released;
    }

    private static RedisKey[] BuildHoldKeys(
        Guid showtimeId,
        Guid holdId,
        IReadOnlyCollection<Guid> seatIds)
    {
        return seatIds
            .Select(seatId => (RedisKey)GetSeatKey(showtimeId, seatId))
            .Append((RedisKey)GetMetadataKey(showtimeId, holdId))
            .ToArray();
    }

    private static string GetSeatKey(
        Guid showtimeId,
        Guid seatId)
    {
        return $"seat-hold:{{{showtimeId}}}:{seatId}";
    }

    private static string GetMetadataKey(
        Guid showtimeId,
        Guid holdId)
    {
        return $"hold:{{{showtimeId}}}:{holdId}";
    }

    private static string GetHoldIndexKey(Guid holdId)
    {
        return $"hold-index:{holdId}";
    }

    private static bool IsLegacyHoldBy(
        string value,
        Guid holderId)
    {
        if (value == holderId.ToString())
        {
            return true;
        }

        try
        {
            var payload =
                JsonSerializer.Deserialize<LegacySeatHoldPayload>(value);

            return payload?.UserId == holderId;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private sealed class LegacySeatHoldPayload
    {
        public Guid UserId { get; set; }
    }
}
