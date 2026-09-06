namespace CinemaBooking.Modules.Catalog.Domain.Imports;

public sealed class MovieImportBatch
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Source { get; set; } = string.Empty;

    public MovieImportBatchStatus Status { get; set; } =
        MovieImportBatchStatus.Running;

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    public DateTime? FinishedAt { get; set; }

    public string? Error { get; set; }

    public ICollection<MovieImportCandidate> Candidates { get; set; } =
        new List<MovieImportCandidate>();
}
