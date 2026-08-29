using System.ComponentModel.DataAnnotations;

namespace CinemaBooking.Modules.Theater.Application.Seats;

public class CreateSeatRequest
{
    [Required]
    [MaxLength(10)]
    public string Row { get; set; } = string.Empty;

    [Range(1, 500)]
    public int Number { get; set; }
}
