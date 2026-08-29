namespace CinemaBooking.Modules.Scheduling.Contracts;

public interface ISchedulingModule
{
    Task<ShowtimeInfo?> GetShowtimeAsync(Guid showtimeId);
}
