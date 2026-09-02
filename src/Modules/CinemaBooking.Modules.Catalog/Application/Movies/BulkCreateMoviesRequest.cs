using System.ComponentModel.DataAnnotations;

namespace CinemaBooking.Modules.Catalog.Application.Movies;

public sealed class BulkCreateMoviesRequest
{
    [Required]
    public IReadOnlyCollection<CreateMovieRequest> Movies { get; set; } =
        Array.Empty<CreateMovieRequest>();
}
