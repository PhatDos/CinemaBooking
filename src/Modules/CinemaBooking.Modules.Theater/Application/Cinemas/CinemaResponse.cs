namespace CinemaBooking.Modules.Theater.Application.Cinemas;

public sealed record CinemaResponse(
    Guid Id,
    string Name,
    string Address,
    string City,
    string? Description,
    bool IsActive,
    List<RoomResponse> Rooms);

public class RoomResponse
{
    public Guid Id { get; set; }

    public Guid CinemaId { get; set; }

    public string Name { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    public List<SeatResponse> Seats { get; set; } = [];
}

public class SeatResponse
{
    public Guid Id { get; set; }

    public Guid RoomId { get; set; }

    public string Row { get; set; } = string.Empty;

    public int Number { get; set; }

    public string Type { get; set; } = "Standard";
}
