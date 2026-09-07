namespace CinemaBooking.Modules.Catalog.Domain;

public class Movie
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int DurationMinutes { get; set; }

    public DateTime ReleaseDate { get; set; }

    public string? PosterUrl { get; set; }

    public string? PosterPublicId { get; set; }

    public string? TrailerUrl { get; set; }

    public Guid? GenreId { get; set; }

    public string? Genre { get; set; }

    public Genre? GenreRef { get; set; }

    public ICollection<MovieGenre> MovieGenres { get; set; } =
        new List<MovieGenre>();

    public bool IsActive { get; set; } = true;
}
