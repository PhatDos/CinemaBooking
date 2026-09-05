using CinemaBooking.Modules.Theater.Application.Cinemas;
using CinemaBooking.Modules.Theater.Application.Interfaces;
using CinemaBooking.Modules.Theater.Application.Rooms;
using CinemaBooking.Modules.Theater.Application.Seats;
using CinemaBooking.Modules.Theater.Domain;
using CinemaBooking.SharedKernel.Exceptions;

namespace CinemaBooking.Modules.Theater.Application;

public class TheaterService
{
    private const int MaximumBulkSeats = 500;

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

    public async Task<List<RoomResponse>> GetRoomsByCinemaAsync(Guid cinemaId)
    {
        var cinema = await _repository.GetCinemaByIdAsync(cinemaId);

        if (cinema is null)
        {
            throw new NotFoundException("Cinema was not found.");
        }

        var rooms = await _repository.GetRoomsByCinemaIdAsync(cinemaId);

        return rooms
            .Select(ToResponse)
            .ToList();
    }

    public async Task<RoomResponse?> GetRoomByIdAsync(Guid id)
    {
        var room = await _repository.GetRoomByIdAsync(id);

        if (room is null)
        {
            return null;
        }

        return ToResponse(room);
    }

    public async Task<List<SeatResponse>> GetAllSeatsAsync()
    {
        var seats = await _repository.GetAllSeatsAsync();

        return seats
            .Select(ToResponse)
            .ToList();
    }

    public async Task<List<SeatResponse>> GetSeatsByRoomAsync(Guid roomId)
    {
        var room = await _repository.GetRoomByIdAsync(roomId);

        if (room is null)
        {
            throw new NotFoundException("Room was not found.");
        }

        var seats = await _repository.GetSeatsByRoomIdAsync(roomId);

        return seats
            .Select(ToResponse)
            .ToList();
    }

    public async Task<Guid> CreateCinemaAsync(CreateCinemaRequest request)
    {
        var cinema = new Cinema
        {
            Name = request.Name.Trim(),
            Address = request.Address.Trim(),
            City = request.City.Trim(),
            Description = request.Description?.Trim(),
            IsActive = true
        };

        await _repository.AddCinemaAsync(cinema);

        return cinema.Id;
    }

    public async Task<RoomResponse?> CreateRoomAsync(
        Guid cinemaId,
        CreateRoomRequest request)
    {
        ValidateRoom(request.Name);

        var cinema = await _repository.GetCinemaByIdAsync(cinemaId);

        if (cinema is null)
        {
            return null;
        }

        var room = new Room
        {
            CinemaId = cinemaId,
            Name = request.Name.Trim(),
            IsActive = request.IsActive
        };

        await _repository.AddRoomAsync(room);

        return ToResponse(room);
    }

    public async Task<RoomResponse> UpdateRoomAsync(
        Guid roomId,
        UpdateRoomRequest request)
    {
        ValidateRoom(request.Name);

        var room = await _repository.GetRoomByIdAsync(roomId);

        if (room is null)
        {
            throw new NotFoundException("Room was not found.");
        }

        room.Name = request.Name.Trim();
        room.IsActive = request.IsActive;

        await _repository.SaveChangesAsync();

        return ToResponse(room);
    }

    public async Task<SeatResponse?> CreateSeatAsync(
        Guid roomId,
        CreateSeatRequest request)
    {
        ValidateSeat(request);

        var room = await _repository.GetRoomByIdAsync(roomId);

        if (room is null)
        {
            return null;
        }

        var existingSeats = await _repository.GetSeatsByRoomIdAsync(roomId);
        var row = NormalizeRow(request.Row);

        EnsureSeatDoesNotExist(
            existingSeats,
            row,
            request.Number);

        var seat = new Seat
        {
            RoomId = roomId,
            Row = row,
            Number = request.Number,
            Type = ParseSeatType(request.Type)
        };

        await _repository.AddSeatAsync(seat);

        return ToResponse(seat);
    }

    public async Task<BulkCreateSeatsResult> BulkCreateSeatsAsync(
        Guid roomId,
        IReadOnlyCollection<CreateSeatRequest>? requests)
    {
        if (requests is null || requests.Count == 0)
        {
            throw new BusinessRuleException(
                "At least one seat is required.");
        }

        if (requests.Count > MaximumBulkSeats)
        {
            throw new BusinessRuleException(
                $"A maximum of {MaximumBulkSeats} seats can be created at once.");
        }

        var room = await _repository.GetRoomByIdAsync(roomId);

        if (room is null)
        {
            throw new NotFoundException("Room was not found.");
        }

        foreach (var request in requests)
        {
            ValidateSeat(request);
        }

        var normalizedRequests =
            requests
                .Select(request => new NormalizedSeatRequest(
                    NormalizeRow(request.Row),
                    request.Number,
                    ParseSeatType(request.Type)))
                .ToArray();

        var duplicateRequestedSeats =
            normalizedRequests
                .GroupBy(seat => new
                {
                    seat.Row,
                    seat.Number
                })
                .FirstOrDefault(group => group.Count() > 1);

        if (duplicateRequestedSeats is not null)
        {
            throw new BusinessRuleException(
                $"Duplicate seat {duplicateRequestedSeats.Key.Row}{duplicateRequestedSeats.Key.Number} in request.");
        }

        var existingSeats = await _repository.GetSeatsByRoomIdAsync(roomId);
        var existingSeatKeys =
            existingSeats
                .Select(seat => $"{seat.Row}:{seat.Number}")
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var request in normalizedRequests)
        {
            if (!existingSeatKeys.Contains($"{request.Row}:{request.Number}"))
            {
                continue;
            }

            throw new ConflictException(
                $"Seat {request.Row}{request.Number} already exists.");
        }

        var seats =
            normalizedRequests
                .Select(request => new Seat
                {
                    RoomId = roomId,
                    Row = request.Row,
                    Number = request.Number,
                    Type = request.Type
                })
                .ToArray();

        await _repository.AddSeatsAsync(seats);

        return new BulkCreateSeatsResult(
            seats.Length,
            seats.Select(seat => seat.Id).ToArray());
    }

    private static CinemaResponse ToResponse(Cinema cinema)
    {
        return new CinemaResponse(
            cinema.Id,
            cinema.Name,
            cinema.Address,
            cinema.City,
            cinema.Description,
            cinema.IsActive,
            cinema.Rooms.Select(ToResponse).ToList());
    }

    private static RoomResponse ToResponse(Room room)
    {
        return new RoomResponse
        {
            Id = room.Id,
            CinemaId = room.CinemaId,
            Name = room.Name,
            IsActive = room.IsActive,
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
            Number = seat.Number,
            Type = seat.Type.ToString()
        };
    }

    private static void ValidateRoom(string? name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new BusinessRuleException("Room name is required.");
        }
    }

    private static void ValidateSeat(CreateSeatRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Row))
        {
            throw new BusinessRuleException("Seat row is required.");
        }

        if (request.Number <= 0)
        {
            throw new BusinessRuleException(
                "Seat number must be greater than zero.");
        }

        _ = ParseSeatType(request.Type);
    }

    private static void EnsureSeatDoesNotExist(
        IEnumerable<Seat> seats,
        string row,
        int number)
    {
        if (seats.Any(seat =>
                string.Equals(
                    seat.Row,
                    row,
                    StringComparison.OrdinalIgnoreCase) &&
                seat.Number == number))
        {
            throw new ConflictException(
                $"Seat {row}{number} already exists.");
        }
    }

    private static SeatType ParseSeatType(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return SeatType.Standard;
        }

        if (Enum.TryParse<SeatType>(
                value,
                ignoreCase: true,
                out var type))
        {
            return type;
        }

        throw new BusinessRuleException(
            "Seat type must be Standard, VIP, or Couple.");
    }

    private static string NormalizeRow(string row)
    {
        return row.Trim().ToUpperInvariant();
    }

    private sealed record NormalizedSeatRequest(
        string Row,
        int Number,
        SeatType Type);
}
