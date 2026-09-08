using System.Text.Json;
using CinemaBooking.SharedKernel.Caching;
using StackExchange.Redis;

namespace CinemaBooking.Api.Infrastructure.Caching;

public sealed class RedisAppCache : IAppCache
{
    private static readonly TimeSpan TagIndexTtl = TimeSpan.FromHours(48);

    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web);

    private readonly IDatabase _database;
    private readonly AppCacheKeys _keys;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<RedisAppCache> _logger;

    public RedisAppCache(
        IConnectionMultiplexer redis,
        AppCacheKeys keys,
        IHttpContextAccessor httpContextAccessor,
        ILogger<RedisAppCache> logger)
    {
        _database = redis.GetDatabase();
        _keys = keys;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task<T> GetOrCreateAsync<T>(
        string key,
        IReadOnlyCollection<string> tags,
        TimeSpan ttl,
        Func<CancellationToken, Task<T>> factory,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var cachedJson = await _database.StringGetAsync(key);

            if (cachedJson.HasValue)
            {
                var cached =
                    JsonSerializer.Deserialize<T>(
                        cachedJson.ToString(),
                        JsonOptions);

                if (cached is not null)
                {
                    SetCacheHeader("HIT");
                    return cached;
                }
            }
        }
        catch (RedisException exception)
        {
            _logger.LogWarning(
                exception,
                "Redis cache bypassed for key {CacheKey}.",
                key);
            SetCacheHeader("BYPASS");

            return await factory(cancellationToken);
        }
        catch (JsonException exception)
        {
            _logger.LogWarning(
                exception,
                "Redis cache value could not be read for key {CacheKey}.",
                key);
            SetCacheHeader("BYPASS");
            await RemoveAsync(key, cancellationToken);

            return await factory(cancellationToken);
        }

        var value = await factory(cancellationToken);

        if (value is not null)
        {
            try
            {
                await _database.StringSetAsync(
                    key,
                    JsonSerializer.Serialize(value, JsonOptions),
                    ttl);

                await AddTagIndexesAsync(key, tags);
            }
            catch (RedisException exception)
            {
                _logger.LogWarning(
                    exception,
                    "Redis cache value could not be stored for key {CacheKey}.",
                    key);
                SetCacheHeader("BYPASS");

                return value;
            }
        }

        SetCacheHeader("MISS");

        return value;
    }

    public async Task RemoveAsync(
        string key,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _database.KeyDeleteAsync(key);
        }
        catch (RedisException exception)
        {
            _logger.LogWarning(
                exception,
                "Redis cache key {CacheKey} could not be removed.",
                key);
        }
    }

    public async Task InvalidateTagsAsync(
        IReadOnlyCollection<string> tags,
        CancellationToken cancellationToken = default)
    {
        foreach (var tag in tags.Where(item => !string.IsNullOrWhiteSpace(item)))
        {
            var tagKey = _keys.Tag(tag);

            try
            {
                var members = await _database.SetMembersAsync(tagKey);

                if (members.Length > 0)
                {
                    var cacheKeys = members
                        .Where(member => member.HasValue)
                        .Select(member => (RedisKey)member.ToString())
                        .ToArray();

                    if (cacheKeys.Length > 0)
                    {
                        await _database.KeyDeleteAsync(cacheKeys);
                    }
                }

                await _database.KeyDeleteAsync(tagKey);
            }
            catch (RedisException exception)
            {
                _logger.LogWarning(
                    exception,
                    "Redis cache tag {CacheTag} could not be invalidated.",
                    tag);
            }
        }
    }

    private async Task AddTagIndexesAsync(
        string key,
        IReadOnlyCollection<string> tags)
    {
        foreach (var tag in tags.Where(item => !string.IsNullOrWhiteSpace(item)))
        {
            var tagKey = _keys.Tag(tag);

            await _database.SetAddAsync(tagKey, key);
            await _database.KeyExpireAsync(tagKey, TagIndexTtl);
        }
    }

    private void SetCacheHeader(string status)
    {
        var response = _httpContextAccessor.HttpContext?.Response;

        if (response is not null &&
            !response.HasStarted)
        {
            response.Headers["X-Cache"] = status;
        }
    }
}
