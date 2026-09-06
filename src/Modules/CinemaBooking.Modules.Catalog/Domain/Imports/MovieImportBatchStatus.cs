using System.Text.Json.Serialization;

namespace CinemaBooking.Modules.Catalog.Domain.Imports;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MovieImportBatchStatus
{
    Running = 1,
    Completed = 2,
    Failed = 3
}
