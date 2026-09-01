namespace CinemaBooking.Modules.Identity.Application.Auth;

public sealed class CurrentUserResponse
{
    public Guid UserId { get; init; }

    public string Email { get; init; } = string.Empty;

    public IReadOnlyList<string> Roles { get; init; } = [];
}
