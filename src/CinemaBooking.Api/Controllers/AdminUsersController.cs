using CinemaBooking.Modules.Identity.Application.Roles;
using CinemaBooking.Modules.Identity.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = AppRoles.Admin)]
public sealed class AdminUsersController : ControllerBase
{
    private readonly IIdentityModule _identityModule;

    public AdminUsersController(
        IIdentityModule identityModule)
    {
        _identityModule = identityModule;
    }

    [HttpPost("{userId:guid}/staff")]
    public async Task<IActionResult> MakeStaff(
        Guid userId,
        CancellationToken cancellationToken)
    {
        await _identityModule.AddToStaffRoleAsync(
            userId,
            cancellationToken);

        return NoContent();
    }
}
