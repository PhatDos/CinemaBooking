using System.Text.Json;
using System.Text.Json.Serialization;
using CinemaBooking.SharedKernel.Exceptions;
using StackExchange.Redis;

namespace CinemaBooking.Api.Locations;

public sealed class VietnamLocationService : IVietnamLocationService
{
    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web);

    private static readonly TimeSpan CacheDuration =
        TimeSpan.FromHours(24);

    private readonly HttpClient _httpClient;
    private readonly IDatabase _redis;

    public VietnamLocationService(
        HttpClient httpClient,
        IConnectionMultiplexer redis)
    {
        _httpClient = httpClient;
        _redis = redis.GetDatabase();
    }

    public async Task<IReadOnlyList<LocationItemResponse>> GetProvincesAsync(
        CancellationToken cancellationToken = default)
    {
        return await GetOrCreateAsync(
            "locations:vietnam:v2:provinces",
            async token =>
            {
                var provinces =
                    await GetJsonAsync<List<ProvinceDto>>(
                        string.Empty,
                        token);

                return provinces
                    .OrderBy(province => province.Name)
                    .Select(province => new LocationItemResponse(
                        province.Code.ToString(),
                        province.Name))
                    .ToList();
            },
            cancellationToken);
    }

    public async Task<IReadOnlyList<LocationItemResponse>> GetWardsAsync(
        string provinceCode,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(provinceCode))
        {
            throw new BusinessRuleException("Province code is required.");
        }

        var normalizedProvinceCode = provinceCode.Trim();

        return await GetOrCreateAsync(
            $"locations:vietnam:v2:province:{normalizedProvinceCode}:wards",
            async token =>
            {
                var province =
                    await GetJsonAsync<ProvinceDto>(
                        $"p/{Uri.EscapeDataString(normalizedProvinceCode)}?depth=2",
                        token);

                return province.Wards
                    .OrderBy(ward => ward.Name)
                    .Select(ward => new LocationItemResponse(
                        ward.Code.ToString(),
                        ward.Name))
                    .ToList();
            },
            cancellationToken);
    }

    private async Task<IReadOnlyList<LocationItemResponse>> GetOrCreateAsync(
        string cacheKey,
        Func<CancellationToken, Task<IReadOnlyList<LocationItemResponse>>> factory,
        CancellationToken cancellationToken)
    {
        var cachedJson =
            await _redis.StringGetAsync(cacheKey);

        if (cachedJson.HasValue)
        {
            var cached =
                JsonSerializer.Deserialize<IReadOnlyList<LocationItemResponse>>(
                    cachedJson.ToString(),
                    JsonOptions);

            if (cached is not null)
            {
                return cached;
            }
        }

        var value = await factory(cancellationToken);

        await _redis.StringSetAsync(
            cacheKey,
            JsonSerializer.Serialize(value, JsonOptions),
            CacheDuration);

        return value;
    }

    private async Task<T> GetJsonAsync<T>(
        string path,
        CancellationToken cancellationToken)
    {
        using var response =
            await _httpClient.GetAsync(
                path,
                cancellationToken);

        response.EnsureSuccessStatusCode();

        var value =
            await response.Content.ReadFromJsonAsync<T>(
                JsonOptions,
                cancellationToken);

        return value ??
            throw new InvalidOperationException(
                "Vietnam location API returned an empty response.");
    }

    private sealed class ProvinceDto
    {
        public string Name { get; set; } = string.Empty;

        public int Code { get; set; }

        public List<WardDto> Wards { get; set; } = [];
    }

    private sealed class WardDto
    {
        public string Name { get; set; } = string.Empty;

        public int Code { get; set; }

        [JsonPropertyName("province_code")]
        public int ProvinceCode { get; set; }
    }
}
