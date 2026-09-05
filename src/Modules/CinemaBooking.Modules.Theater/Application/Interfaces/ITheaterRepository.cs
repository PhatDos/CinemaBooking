using CinemaBooking.Modules.Theater.Domain;

namespace CinemaBooking.Modules.Theater.Application.Interfaces;

public interface ITheaterRepository
{
    Task<List<Cinema>> GetAllCinemasAsync();

    Task<Cinema?> GetCinemaByIdAsync(Guid id);

    Task<List<Room>> GetAllRoomsAsync();

    Task<List<Room>> GetRoomsByCinemaIdAsync(Guid cinemaId);

    Task<Room?> GetRoomByIdAsync(Guid id);

    Task<List<Seat>> GetAllSeatsAsync();

    Task<List<Seat>> GetSeatsByRoomIdAsync(Guid roomId);

    Task AddCinemaAsync(Cinema cinema);

    Task AddRoomAsync(Room room);

    Task AddSeatAsync(Seat seat);

    Task AddSeatsAsync(IReadOnlyCollection<Seat> seats);

    Task SaveChangesAsync();
}
