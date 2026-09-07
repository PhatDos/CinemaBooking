namespace CinemaBooking.Modules.Catalog.Domain;

public sealed class MovieGenre
{
    public Guid MovieId { get; set; }

    public Movie? Movie { get; set; }

    public Guid GenreId { get; set; }

    public Genre? Genre { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
