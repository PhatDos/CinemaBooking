using System.ComponentModel.DataAnnotations;

namespace CinemaBooking.Modules.Scheduling.Application.Showtimes;

public sealed class BulkCreateShowtimesRequest
{
    public Guid MovieId { get; set; }

    public Guid RoomId { get; set; }

    [Required]
    public IReadOnlyCollection<DateTime> StartTimes { get; set; } =
        Array.Empty<DateTime>();

    [Range(0, 10000000)]
    public decimal BasePrice { get; set; }

    [Range(0, 10000000)]
    public decimal? StandardPrice { get; set; }

    [Range(0, 10000000)]
    public decimal? VipPrice { get; set; }

    [Range(0, 10000000)]
    public decimal? CouplePrice { get; set; }
}
