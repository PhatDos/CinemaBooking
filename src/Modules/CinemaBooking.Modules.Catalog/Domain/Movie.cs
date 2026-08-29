namespace CinemaBooking.Modules.Catalog.Domain;

public class Movie
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int DurationMinutes { get; set; }

    public DateTime ReleaseDate { get; set; }
}