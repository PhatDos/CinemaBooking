using System.Text.Json.Serialization;

namespace CinemaBooking.Modules.Catalog.Domain.Imports;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MovieImportCandidateStatus
{
    NewSuggested = 1,
    UpdateSuggested = 2,
    NeedsReview = 3,
    Approved = 4,
    Rejected = 5
}
