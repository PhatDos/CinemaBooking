using CinemaBooking.Api.Infrastructure.Caching;
using CinemaBooking.Modules.Catalog.Application.MovieImports;
using CinemaBooking.Modules.Identity.Application.Roles;
using CinemaBooking.SharedKernel.Caching;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CinemaBooking.Api.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/admin/movie-imports")]
public sealed class AdminMovieImportsController : ControllerBase
{
    private readonly MovieImportService _movieImportService;
    private readonly IAppCache _cache;

    public AdminMovieImportsController(
        MovieImportService movieImportService,
        IAppCache cache)
    {
        _movieImportService = movieImportService;
        _cache = cache;
    }

    [HttpPost("discover")]
    public async Task<IActionResult> Discover(
        MovieImportRunRequest request,
        CancellationToken cancellationToken)
    {
        var batch =
            await _movieImportService.DiscoverAsync(
                request,
                cancellationToken);

        return Ok(batch);
    }

    [HttpPost("run")]
    public async Task<IActionResult> Run(
        MovieImportRunRequest request,
        CancellationToken cancellationToken)
    {
        var batch =
            await _movieImportService.RunAsync(
                request,
                cancellationToken);

        return Ok(batch);
    }

    [HttpPost("{batchId:guid}/crawl")]
    public async Task<IActionResult> CrawlBatch(
        Guid batchId,
        CancellationToken cancellationToken)
    {
        var batch =
            await _movieImportService.CrawlBatchAsync(
                batchId,
                cancellationToken);

        return Ok(batch);
    }

    [HttpGet]
    public async Task<IActionResult> GetBatches(
        CancellationToken cancellationToken)
    {
        return Ok(
            await _movieImportService.GetBatchesAsync(
                cancellationToken));
    }

    [HttpGet("{batchId:guid}/candidates")]
    public async Task<IActionResult> GetCandidates(
        Guid batchId,
        CancellationToken cancellationToken)
    {
        return Ok(
            await _movieImportService.GetCandidatesAsync(
                batchId,
                cancellationToken));
    }

    [HttpPost("/api/admin/movie-import-candidates/{candidateId:guid}/approve")]
    public async Task<IActionResult> ApproveCandidate(
        Guid candidateId,
        CancellationToken cancellationToken)
    {
        var movie =
            await _movieImportService.ApproveAsync(
                candidateId,
                cancellationToken);
        await _cache.InvalidateTagsAsync(
            [
                AppCacheTags.CatalogMovies,
                AppCacheTags.CatalogGenres
            ],
            cancellationToken);

        return Ok(movie);
    }

    [HttpPost("/api/admin/movie-import-candidates/{candidateId:guid}/reject")]
    public async Task<IActionResult> RejectCandidate(
        Guid candidateId,
        CancellationToken cancellationToken)
    {
        await _movieImportService.RejectAsync(
            candidateId,
            cancellationToken);

        return NoContent();
    }

    [HttpPost("/api/admin/movie-import-candidates/{candidateId:guid}/crawl")]
    public async Task<IActionResult> CrawlCandidate(
        Guid candidateId,
        CancellationToken cancellationToken)
    {
        return Ok(
            await _movieImportService.CrawlCandidateAsync(
                candidateId,
                cancellationToken));
    }
}
