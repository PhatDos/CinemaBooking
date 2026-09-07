using System.Text.Json.Serialization;

namespace CinemaBooking.Modules.Catalog.Domain.Imports;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MovieImportCandidateStatus
{
    Discovered = 1,
    Crawled = 2,
    Failed = 3,
    NeedsReview = 4,
    Approved = 5,
    Rejected = 6
}
