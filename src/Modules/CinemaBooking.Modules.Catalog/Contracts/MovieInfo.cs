namespace CinemaBooking.Modules.Catalog.Contracts;

public sealed record MovieInfo(
    Guid Id,
    string Title,
    string Description,
    int DurationMinutes,
    DateTime ReleaseDate,
    string? PosterUrl,
    string? TrailerUrl,
    string? Genre,
    bool IsActive);
