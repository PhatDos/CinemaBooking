using CinemaBooking.Modules.Catalog.Domain.Imports;

namespace CinemaBooking.Modules.Catalog.Application.MovieImports;

public sealed class MovieImportBatchResponse
{
    public Guid Id { get; init; }

    public string Source { get; init; } = string.Empty;

    public MovieImportBatchStatus Status { get; init; }

    public DateTime StartedAt { get; init; }

    public DateTime? FinishedAt { get; init; }

    public string? Error { get; init; }

    public int CandidateCount { get; init; }
}
