namespace CinemaBooking.Modules.Identity.Contracts;

public interface IIdentityModule
{
    Task AddToStaffRoleAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task AssignStaffToCinemaAsync(
        Guid userId,
        Guid cinemaId,
        CancellationToken cancellationToken = default);

    Task<bool> IsStaffOfCinemaAsync(
        Guid userId,
        Guid cinemaId,
        CancellationToken cancellationToken = default);
}
