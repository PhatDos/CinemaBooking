namespace CinemaBooking.Modules.Theater.Contracts;

public sealed record CinemaInfo(
    Guid Id,
    string Name,
    string Address,
    string City,
    string? Description,
    string? ImageUrl,
    bool IsActive,
    string? ProvinceCode = null,
    string? ProvinceName = null,
    string? WardCode = null,
    string? WardName = null,
    string? AddressLine = null);
