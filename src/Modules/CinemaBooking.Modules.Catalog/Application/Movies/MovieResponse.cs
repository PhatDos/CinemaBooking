namespace CinemaBooking.Modules.Catalog.Application.Movies;

public class MovieResponse
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int DurationMinutes { get; set; }

    public DateTime ReleaseDate { get; set; }

    public string? PosterUrl { get; set; }

    public string? PosterPublicId { get; set; }

    public string? TrailerUrl { get; set; }

    public Guid? GenreId { get; set; }

    public string? Genre { get; set; }

    public IReadOnlyList<MovieGenreResponse> Genres { get; set; } =
        [];

    public bool IsActive { get; set; }
}
