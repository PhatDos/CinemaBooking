using System.ComponentModel.DataAnnotations;

namespace CinemaBooking.Modules.Theater.Application.Cinemas;

public class CreateCinemaRequest
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Address { get; set; } = string.Empty;
}
