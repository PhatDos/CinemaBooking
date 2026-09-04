namespace CinemaBooking.Modules.Identity.Contracts;

public sealed record UserContactInfo(
    Guid UserId,
    string Email,
    string? DisplayName);
