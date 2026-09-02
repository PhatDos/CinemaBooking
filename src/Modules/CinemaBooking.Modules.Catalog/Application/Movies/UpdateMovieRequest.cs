using System.ComponentModel.DataAnnotations;

namespace CinemaBooking.Modules.Catalog.Application.Movies;

public class UpdateMovieRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Range(1, 600)]
    public int DurationMinutes { get; set; }

    public DateTime ReleaseDate { get; set; }

    [MaxLength(1000)]
    public string? PosterUrl { get; set; }

    [MaxLength(1000)]
    public string? TrailerUrl { get; set; }

    [MaxLength(100)]
    public string? Genre { get; set; }

    public bool IsActive { get; set; }
}
