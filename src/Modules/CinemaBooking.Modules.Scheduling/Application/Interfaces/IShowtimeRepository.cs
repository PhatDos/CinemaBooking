using CinemaBooking.Modules.Scheduling.Domain;

namespace CinemaBooking.Modules.Scheduling.Application.Interfaces;

public interface IShowtimeRepository
{
    Task AddAsync(Showtime showtime);

    Task<Showtime?> GetByIdAsync(Guid id);

    Task<List<Showtime>> GetAllAsync();

    Task<bool> HasOverlappingShowtimeAsync(
        Guid roomId,
        DateTime startTime,
        DateTime endTime);
}
