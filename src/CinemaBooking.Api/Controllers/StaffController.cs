using CinemaBooking.Api.Authentication;
using CinemaBooking.Modules.Identity.Application.Roles;
using CinemaBooking.Modules.Identity.Contracts;
using CinemaBooking.Modules.Theater.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/staff")]
[Authorize(Roles = AppRoles.Staff)]
public sealed class StaffController : ControllerBase
{
    private readonly IIdentityModule _identityModule;
    private readonly ITheaterModule _theaterModule;

    public StaffController(
        IIdentityModule identityModule,
        ITheaterModule theaterModule)
    {
        _identityModule = identityModule;
        _theaterModule = theaterModule;
    }

    [HttpGet("me/cinemas")]
    public async Task<IActionResult> GetMyCinemas(
        CancellationToken cancellationToken)
    {
        var cinemaIds =
            await _identityModule.GetAssignedCinemaIdsAsync(
                User.GetUserId(),
                cancellationToken);

        var cinemas =
            await _theaterModule.GetCinemasByIdsAsync(
                cinemaIds,
                cancellationToken);

        return Ok(cinemas);
    }
}
