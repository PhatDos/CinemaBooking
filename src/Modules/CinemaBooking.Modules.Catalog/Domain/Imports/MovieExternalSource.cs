namespace CinemaBooking.Modules.Catalog.Domain.Imports;

public sealed class MovieExternalSource
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid MovieId { get; set; }

    public Movie? Movie { get; set; }

    public string Source { get; set; } = string.Empty;

    public string SourceUrl { get; set; } = string.Empty;

    public string ContentHash { get; set; } = string.Empty;

    public DateTime LastSyncedAt { get; set; } = DateTime.UtcNow;
}
