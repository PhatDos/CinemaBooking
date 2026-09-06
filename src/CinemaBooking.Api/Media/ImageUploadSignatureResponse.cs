namespace CinemaBooking.Api.Media;

public sealed record ImageUploadSignatureResponse(
    string CloudName,
    string ApiKey,
    long Timestamp,
    string Signature,
    string Folder,
    string UploadUrl);
