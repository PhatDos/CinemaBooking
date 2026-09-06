namespace CinemaBooking.Api.Locations;

public interface IVietnamLocationService
{
    Task<IReadOnlyList<LocationItemResponse>> GetProvincesAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<LocationItemResponse>> GetWardsAsync(
        string provinceCode,
        CancellationToken cancellationToken = default);
}
