using CinemaBooking.Modules.Theater.Application.Cinemas;
using CinemaBooking.Modules.Theater.Application.Interfaces;
using CinemaBooking.Modules.Theater.Application.Rooms;
using CinemaBooking.Modules.Theater.Application.Seats;
using CinemaBooking.Modules.Theater.Domain;

namespace CinemaBooking.Modules.Theater.Application;

public class TheaterService
{
    private readonly ITheaterRepository _repository;

    public TheaterService(ITheaterRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<CinemaResponse>> GetAllCinemasAsync()
    {
        var cinemas = await _repository.GetAllCinemasAsync();

        return cinemas
            .Select(ToResponse)
            .ToList();
    }

    public async Task<CinemaResponse?> GetCinemaByIdAsync(Guid id)
    {
        var cinema = await _repository.GetCinemaByIdAsync(id);

        if (cinema is null)
        {
            return null;
        }

        return ToResponse(cinema);
    }

    public async Task<List<RoomResponse>> GetAllRoomsAsync()
    {
        var rooms = await _repository.GetAllRoomsAsync();

        return rooms
            .Select(ToResponse)
            .ToList();
    }

    public async Task<List<SeatResponse>> GetAllSeatsAsync()
    {
        var seats = await _repository.GetAllSeatsAsync();

        return seats
            .Select(ToResponse)
            .ToList();
    }

    public async Task<Guid> CreateCinemaAsync(CreateCinemaRequest request)
    {
        var cinema = new Cinema
        {
            Name = request.Name.Trim(),
            Address = request.Address.Trim()
        };

        await _repository.AddCinemaAsync(cinema);

        return cinema.Id;
    }

    public async Task<Guid?> CreateRoomAsync(
        Guid cinemaId,
        CreateRoomRequest request)
    {
        var cinema = await _repository.GetCinemaByIdAsync(cinemaId);

        if (cinema is null)
        {
            return null;
        }

        var room = new Room
        {
            CinemaId = cinemaId,
            Name = request.Name.Trim()
        };

        await _repository.AddRoomAsync(room);

        return room.Id;
    }

    public async Task<Guid?> CreateSeatAsync(
        Guid roomId,
        CreateSeatRequest request)
    {
        var room = await _repository.GetRoomByIdAsync(roomId);

        if (room is null)
        {
            return null;
        }

        var seat = new Seat
        {
            RoomId = roomId,
            Row = request.Row.Trim().ToUpperInvariant(),
            Number = request.Number
        };

        await _repository.AddSeatAsync(seat);

        return seat.Id;
    }

    private static CinemaResponse ToResponse(Cinema cinema)
    {
        return new CinemaResponse
        {
            Id = cinema.Id,
            Name = cinema.Name,
            Address = cinema.Address,
            Rooms = cinema.Rooms.Select(ToResponse).ToList()
        };
    }

    private static RoomResponse ToResponse(Room room)
    {
        return new RoomResponse
        {
            Id = room.Id,
            CinemaId = room.CinemaId,
            Name = room.Name,
            Seats = room.Seats.Select(ToResponse).ToList()
        };
    }

    private static SeatResponse ToResponse(Seat seat)
    {
        return new SeatResponse
        {
            Id = seat.Id,
            RoomId = seat.RoomId,
            Row = seat.Row,
            Number = seat.Number
        };
    }
}
