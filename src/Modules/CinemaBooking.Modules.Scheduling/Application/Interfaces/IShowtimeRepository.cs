using CinemaBooking.Modules.Scheduling.Domain;

namespace CinemaBooking.Modules.Scheduling.Application.Interfaces;

public interface IShowtimeRepository
{
    Task AddAsync(
        Showtime showtime,
        CancellationToken cancellationToken = default);

    Task AddRangeAsync(
        IReadOnlyCollection<Showtime> showtimes,
        CancellationToken cancellationToken = default);

    Task<Showtime?> GetByIdAsync(Guid id);

    Task<List<Showtime>> GetAllAsync();

    Task<bool> HasOverlappingShowtimeAsync(
        Guid roomId,
        DateTime startTime,
        DateTime endTime,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Showtime>> GetOverlappingAsync(
        Guid roomId,
        DateTime rangeStart,
        DateTime rangeEnd,
        CancellationToken cancellationToken = default);

    Task<TResult> ExecuteInSerializableTransactionAsync<TResult>(
        Func<CancellationToken, Task<TResult>> action,
        CancellationToken cancellationToken = default);
}
