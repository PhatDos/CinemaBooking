using CinemaBooking.Api.Authentication;
using CinemaBooking.Modules.Identity.Application.Roles;
using CinemaBooking.Modules.Identity.Contracts;
using CinemaBooking.Modules.Theater.Contracts;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/cinemas")]
public sealed class CinemaStaffController : ControllerBase
{
    private readonly ITheaterModule _theaterModule;
    private readonly IIdentityModule _identityModule;

    public CinemaStaffController(
        ITheaterModule theaterModule,
        IIdentityModule identityModule)
    {
        _theaterModule = theaterModule;
        _identityModule = identityModule;
    }

    [Authorize(Roles = AppRoles.Admin)]
    [HttpPost("{cinemaId:guid}/staff")]
    public async Task<IActionResult> AssignStaff(
        Guid cinemaId,
        AssignStaffRequest request,
        CancellationToken cancellationToken)
    {
        var cinemaExists =
            await _theaterModule.CinemaExistsAsync(
                cinemaId,
                cancellationToken);

        if (!cinemaExists)
        {
            throw new NotFoundException("Cinema was not found.");
        }

        await _identityModule.AssignStaffToCinemaAsync(
            request.UserId,
            cinemaId,
            cancellationToken);

        return NoContent();
    }

    [Authorize(Roles = AppRoles.Staff)]
    [HttpGet("{cinemaId:guid}/staff/me")]
    public async Task<IActionResult> IsCurrentStaffAssigned(
        Guid cinemaId,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();

        var isAssigned =
            await _identityModule.IsStaffOfCinemaAsync(
                userId,
                cinemaId,
                cancellationToken);

        return Ok(new
        {
            cinemaId,
            userId,
            isAssigned
        });
    }
}

public sealed record AssignStaffRequest(
    Guid UserId);
