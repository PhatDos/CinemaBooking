using CinemaBooking.Api.Media;
using CinemaBooking.Modules.Identity.Application.Roles;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/media")]
public sealed class MediaController : ControllerBase
{
    [Authorize(Roles = AppRoles.Admin)]
    [HttpPost("movie-poster/sign-upload")]
    public IActionResult SignMoviePosterUpload(
        [FromServices] IImageUploadSignatureService signatureService)
    {
        return Ok(signatureService.CreateMoviePosterSignature());
    }
}
