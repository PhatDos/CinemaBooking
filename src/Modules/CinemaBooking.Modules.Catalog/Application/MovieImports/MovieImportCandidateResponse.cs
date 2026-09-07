using CinemaBooking.Modules.Catalog.Application.Movies;
using CinemaBooking.Modules.Catalog.Domain.Imports;

namespace CinemaBooking.Modules.Catalog.Application.MovieImports;

public sealed class MovieImportCandidateResponse
{
    public Guid Id { get; init; }

    public Guid BatchId { get; init; }

    public string Source { get; init; } = string.Empty;

    public string SourceUrl { get; init; } = string.Empty;

    public string? ListingTitle { get; init; }

    public IReadOnlyList<string> ListingGenres { get; init; } = [];

    public decimal? Popularity { get; init; }

    public long? ReleaseTimestamp { get; init; }

    public string Title { get; init; } = string.Empty;

    public string NormalizedTitle { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    public int? DurationMinutes { get; init; }

    public DateTime? ReleaseDate { get; init; }

    public string? PosterUrl { get; init; }

    public string? TrailerUrl { get; init; }

    public string? GenreName { get; init; }

    public IReadOnlyList<string> GenreNames { get; init; } = [];

    public Guid? MatchMovieId { get; init; }

    public MovieResponse? MatchMovie { get; init; }

    public MovieImportCandidateStatus Status { get; init; }

    public string? Warnings { get; init; }

    public string? DetailError { get; init; }

    public DateTime CreatedAt { get; init; }

    public DateTime UpdatedAt { get; init; }
}
