using System.Text.Json.Serialization;

namespace CinemaBooking.Modules.Booking.Application.SeatAvailability;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum SeatStatus
{
    [JsonStringEnumMemberName("AVAILABLE")]
    Available,

    [JsonStringEnumMemberName("HELD")]
    Held,

    [JsonStringEnumMemberName("RESERVED")]
    Reserved,

    [JsonStringEnumMemberName("BOOKED")]
    Booked
}
