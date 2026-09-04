using System.Security.Claims;
using CinemaBooking.Api.Authentication;
using CinemaBooking.Modules.Identity.Application.Roles;
using CinemaBooking.Modules.Identity.Contracts;
using CinemaBooking.Modules.Scheduling.Contracts;
using CinemaBooking.Modules.Theater.Contracts;
using CinemaBooking.SharedKernel.Exceptions;

namespace CinemaBooking.Api.Authorization;

public sealed class TicketCheckInAuthorizer
{
    private readonly IIdentityModule _identityModule;
    private readonly ISchedulingModule _schedulingModule;
    private readonly ITheaterModule _theaterModule;

    public TicketCheckInAuthorizer(
        IIdentityModule identityModule,
        ISchedulingModule schedulingModule,
        ITheaterModule theaterModule)
    {
        _identityModule = identityModule;
        _schedulingModule = schedulingModule;
        _theaterModule = theaterModule;
    }

    public async Task AuthorizeAsync(
        ClaimsPrincipal user,
        Guid showtimeId,
        CancellationToken cancellationToken = default)
    {
        if (user.IsInRole(AppRoles.Admin))
        {
            return;
        }

        var showtime =
            await _schedulingModule.GetShowtimeAsync(showtimeId)
            ?? throw new NotFoundException("Showtime not found.");

        var room =
            await _theaterModule.GetRoomAsync(
                showtime.RoomId,
                cancellationToken)
            ?? throw new NotFoundException("Room was not found.");

        var userId = user.GetUserId();

        var isStaffOfCinema =
            await _identityModule.IsStaffOfCinemaAsync(
                userId,
                room.CinemaId,
                cancellationToken);

        if (!isStaffOfCinema)
        {
            throw new ForbiddenException(
                "You are not assigned to this cinema.");
        }
    }
}
