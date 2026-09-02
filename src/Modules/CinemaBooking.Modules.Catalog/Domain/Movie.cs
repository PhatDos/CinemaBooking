namespace CinemaBooking.Modules.Catalog.Domain;

public class Movie
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int DurationMinutes { get; set; }

    public DateTime ReleaseDate { get; set; }

    public string? PosterUrl { get; set; }

    public string? TrailerUrl { get; set; }

    public string? Genre { get; set; }

    public bool IsActive { get; set; } = true;
}
