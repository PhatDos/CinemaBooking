using System.ComponentModel.DataAnnotations;

namespace CinemaBooking.Modules.Catalog.Application.Genres;

public class CreateGenreRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(120)]
    public string? Slug { get; set; }

    [Required]
    [MaxLength(1000)]
    public string ImageUrl { get; set; } = string.Empty;
}
