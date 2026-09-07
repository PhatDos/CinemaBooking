namespace CinemaBooking.Modules.Catalog.Application.Movies;

public sealed class MovieGenreResponse
{
    public Guid Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public string Slug { get; init; } = string.Empty;
}
