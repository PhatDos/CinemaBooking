using System.ComponentModel.DataAnnotations;

namespace CinemaBooking.Modules.Theater.Application.Rooms;

public class CreateRoomRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
}
