namespace CinemaBooking.Modules.Catalog.Application.Movies;

public class MovieResponse
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int DurationMinutes { get; set; }

    public DateTime ReleaseDate { get; set; }
}
