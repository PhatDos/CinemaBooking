using System.ComponentModel.DataAnnotations;

namespace CinemaBooking.Modules.Theater.Application.Seats;

public sealed class BulkCreateSeatsRequest
{
    [Required]
    public IReadOnlyCollection<CreateSeatRequest> Seats { get; set; } =
        Array.Empty<CreateSeatRequest>();
}
