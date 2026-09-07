using System.ComponentModel.DataAnnotations;

namespace CinemaBooking.Modules.Catalog.Application.Movies;

public class UpdateMovieRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(4000)]
    public string Description { get; set; } = string.Empty;

    [Range(1, 500)]
    public int DurationMinutes { get; set; }

    public DateTime ReleaseDate { get; set; }

    [MaxLength(1000)]
    public string? PosterUrl { get; set; }

    [MaxLength(255)]
    public string? PosterPublicId { get; set; }

    [MaxLength(1000)]
    public string? TrailerUrl { get; set; }

    public Guid? GenreId { get; set; }

    public IReadOnlyCollection<Guid>? GenreIds { get; set; }

    public bool IsActive { get; set; }
}
