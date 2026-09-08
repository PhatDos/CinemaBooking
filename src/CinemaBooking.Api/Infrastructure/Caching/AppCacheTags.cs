namespace CinemaBooking.Api.Infrastructure.Caching;

public static class AppCacheTags
{
    public const string CatalogMovies = "catalog:movies";
    public const string CatalogGenres = "catalog:genres";
    public const string SchedulingShowtimes = "scheduling:showtimes";
    public const string TheaterCinemas = "theater:cinemas";

    public static string TheaterCinema(Guid cinemaId) =>
        $"theater:cinema:{cinemaId:N}";

    public static string TheaterRoomSeats(Guid roomId) =>
        $"theater:room:{roomId:N}:seats";
}
