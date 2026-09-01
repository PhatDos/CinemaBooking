using System.ComponentModel.DataAnnotations;

namespace CinemaBooking.Modules.Theater.Application.Cinemas;

public sealed record UpdateCinemaRequest(
    [Required]
    [MaxLength(200)]
    string Name,

    [Required]
    [MaxLength(500)]
    string Address,

    [Required]
    [MaxLength(100)]
    string City,

    [MaxLength(1000)]
    string? Description,

    bool IsActive);
