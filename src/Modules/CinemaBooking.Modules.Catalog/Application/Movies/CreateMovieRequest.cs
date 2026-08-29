using System.ComponentModel.DataAnnotations;

namespace CinemaBooking.Modules.Catalog.Application.Movies;

public class CreateMovieRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Range(1, 600)]
    public int DurationMinutes { get; set; }

    public DateTime ReleaseDate { get; set; }
}
