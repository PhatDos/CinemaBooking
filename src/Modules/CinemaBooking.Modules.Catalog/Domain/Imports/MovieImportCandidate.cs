namespace CinemaBooking.Modules.Catalog.Domain.Imports;

public sealed class MovieImportCandidate
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid BatchId { get; set; }

    public MovieImportBatch? Batch { get; set; }

    public string Source { get; set; } = string.Empty;

    public string SourceUrl { get; set; } = string.Empty;

    public string? ListingTitle { get; set; }

    public string? ListingGenres { get; set; }

    public decimal? Popularity { get; set; }

    public long? ReleaseTimestamp { get; set; }

    public string Title { get; set; } = string.Empty;

    public string NormalizedTitle { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int? DurationMinutes { get; set; }

    public DateTime? ReleaseDate { get; set; }

    public string? PosterUrl { get; set; }

    public string? TrailerUrl { get; set; }

    public string? GenreName { get; set; }

    public Guid? MatchMovieId { get; set; }

    public Movie? MatchMovie { get; set; }

    public MovieImportCandidateStatus Status { get; set; }

    public string? Warnings { get; set; }

    public string? DetailError { get; set; }

    public string ContentHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
