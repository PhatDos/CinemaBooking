using CinemaBooking.Modules.Theater.Domain;

namespace CinemaBooking.Modules.Theater.Application.Interfaces;

public interface ITheaterRepository
{
    Task<List<Cinema>> GetAllCinemasAsync();

    Task<Cinema?> GetCinemaByIdAsync(Guid id);

    Task<List<Room>> GetAllRoomsAsync();

    Task<Room?> GetRoomByIdAsync(Guid id);

    Task<List<Seat>> GetAllSeatsAsync();

    Task AddCinemaAsync(Cinema cinema);

    Task AddRoomAsync(Room room);

    Task AddSeatAsync(Seat seat);
}
