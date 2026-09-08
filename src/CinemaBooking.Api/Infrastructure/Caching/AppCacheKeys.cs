namespace CinemaBooking.Api.Infrastructure.Caching;

public sealed class AppCacheKeys
{
    private readonly string _prefix;

    public AppCacheKeys(IHostEnvironment environment)
    {
        var environmentName =
            string.IsNullOrWhiteSpace(environment.EnvironmentName)
                ? "unknown"
                : environment.EnvironmentName.Trim().ToLowerInvariant();

        _prefix = $"cinema-booking:{environmentName}";
    }

    public string MoviesPublicList =>
        $"{_prefix}:v1:catalog:movies:list:public";

    public string MoviesAdminList =>
        $"{_prefix}:v1:catalog:movies:list:admin";

    public string NowShowing =>
        $"{_prefix}:v1:catalog:movies:now-showing";

    public string GenresPublicList =>
        $"{_prefix}:v1:catalog:genres:list:public";

    public string CinemaList(string? provinceCode, string? wardCode) =>
        $"{_prefix}:v1:theater:cinemas:list:province:{NormalizeCode(provinceCode)}:ward:{NormalizeCode(wardCode)}";

    public string CinemaDetail(Guid cinemaId) =>
        $"{_prefix}:v1:theater:cinemas:detail:{cinemaId:N}";

    public string RoomSeatLayout(Guid roomId) =>
        $"{_prefix}:v1:theater:rooms:{roomId:N}:seat-layout";

    public string Tag(string tag) =>
        $"{_prefix}:cache-tag:{tag}";

    public static string NormalizeCode(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? "all"
            : value.Trim().ToUpperInvariant();
    }
}
