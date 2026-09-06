using CinemaBooking.Api.Locations;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Route("api/locations")]
public sealed class LocationsController : ControllerBase
{
    private readonly IVietnamLocationService _locationService;

    public LocationsController(IVietnamLocationService locationService)
    {
        _locationService = locationService;
    }

    [HttpGet("provinces")]
    public async Task<IActionResult> GetProvinces(
        CancellationToken cancellationToken)
    {
        var provinces =
            await _locationService.GetProvincesAsync(cancellationToken);

        return Ok(provinces);
    }

    [HttpGet("provinces/{provinceCode}/wards")]
    public async Task<IActionResult> GetWards(
        string provinceCode,
        CancellationToken cancellationToken)
    {
        var wards =
            await _locationService.GetWardsAsync(
                provinceCode,
                cancellationToken);

        return Ok(wards);
    }
}
