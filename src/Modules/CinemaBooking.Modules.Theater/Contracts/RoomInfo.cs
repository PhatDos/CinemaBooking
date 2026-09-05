namespace CinemaBooking.Modules.Theater.Contracts;

public sealed record RoomInfo(
    Guid Id,
    Guid CinemaId,
    string Name,
    bool IsActive);
