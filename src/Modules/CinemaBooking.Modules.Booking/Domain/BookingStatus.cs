using System.Text.Json.Serialization;

namespace CinemaBooking.Modules.Booking.Domain;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum BookingStatus
{
    [JsonStringEnumMemberName("PENDING")]
    Pending = 1,

    [JsonStringEnumMemberName("CONFIRMED")]
    Confirmed = 2,

    [JsonStringEnumMemberName("CANCELLED")]
    Cancelled = 3,

    [JsonStringEnumMemberName("EXPIRED")]
    Expired = 4
}
