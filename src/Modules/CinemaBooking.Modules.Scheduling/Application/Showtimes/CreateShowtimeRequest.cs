using System.ComponentModel.DataAnnotations;

namespace CinemaBooking.Modules.Scheduling.Application.Showtimes;

public class CreateShowtimeRequest
{
    public Guid MovieId { get; set; }

    public Guid RoomId { get; set; }

    public DateTime StartTime { get; set; }

    [Range(0, 10000000)]
    public decimal BasePrice { get; set; }

    [Range(0, 10000000)]
    public decimal? StandardPrice { get; set; }

    [Range(0, 10000000)]
    public decimal? VipPrice { get; set; }

    [Range(0, 10000000)]
    public decimal? CouplePrice { get; set; }
}
