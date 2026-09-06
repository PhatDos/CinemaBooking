namespace CinemaBooking.Modules.Scheduling.Contracts;

public interface ISchedulingModule
{
    Task<ShowtimeInfo?> GetShowtimeAsync(
        Guid showtimeId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ShowtimeInfo>> GetShowtimesByMovieAsync(
        Guid movieId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Guid>> GetUpcomingMovieIdsAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ShowtimeInfo>> GetShowtimesByRoomIdsAsync(
        IReadOnlyCollection<Guid> roomIds,
        DateTime? from = null,
        DateTime? to = null,
        bool includePast = false,
        CancellationToken cancellationToken = default);
}
