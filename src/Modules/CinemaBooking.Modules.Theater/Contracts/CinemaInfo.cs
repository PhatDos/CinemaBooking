namespace CinemaBooking.Modules.Theater.Contracts;

public sealed record CinemaInfo(
    Guid Id,
    string Name,
    string Address,
    string City,
    string? Description,
    bool IsActive);
