using System.Security.Claims;
using CinemaBooking.Api.Authentication;
using CinemaBooking.Modules.Identity.Application.Roles;
using CinemaBooking.Modules.Identity.Contracts;
using CinemaBooking.Modules.Theater.Contracts;
using CinemaBooking.SharedKernel.Exceptions;

namespace CinemaBooking.Api.Authorization;

public sealed class CinemaManagementAuthorizer
{
    private readonly IIdentityModule _identityModule;
    private readonly ITheaterModule _theaterModule;

    public CinemaManagementAuthorizer(
        IIdentityModule identityModule,
        ITheaterModule theaterModule)
    {
        _identityModule = identityModule;
        _theaterModule = theaterModule;
    }

    public async Task<RoomInfo> AuthorizeRoomAsync(
        ClaimsPrincipal user,
        Guid roomId,
        CancellationToken cancellationToken = default)
    {
        var room =
            await _theaterModule.GetRoomAsync(
                roomId,
                cancellationToken)
            ?? throw new NotFoundException("Room was not found.");

        var cinema =
            await _theaterModule.GetCinemaAsync(
                room.CinemaId,
                cancellationToken)
            ?? throw new NotFoundException("Cinema was not found.");

        if (!cinema.IsActive)
        {
            throw new BusinessRuleException(
                "Cannot create showtime for an inactive cinema.");
        }

        if (user.IsInRole(AppRoles.Admin))
        {
            return room;
        }

        var userId = user.GetUserId();

        var isStaffOfCinema =
            await _identityModule.IsStaffOfCinemaAsync(
                userId,
                room.CinemaId,
                cancellationToken);

        if (!isStaffOfCinema)
        {
            throw new ForbiddenException(
                "You cannot manage this cinema.");
        }

        return room;
    }
}
