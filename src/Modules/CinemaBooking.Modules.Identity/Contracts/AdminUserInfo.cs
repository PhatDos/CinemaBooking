namespace CinemaBooking.Modules.Identity.Contracts;

public sealed record AdminUserInfo(
    Guid Id,
    string Email,
    string? UserName,
    DateTime CreatedAt,
    IReadOnlyList<string> Roles,
    IReadOnlyList<Guid> AssignedCinemaIds);
