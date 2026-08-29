namespace CinemaBooking.Modules.Theater.Application.Cinemas;

public class CinemaResponse
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public List<RoomResponse> Rooms { get; set; } = [];
}

public class RoomResponse
{
    public Guid Id { get; set; }

    public Guid CinemaId { get; set; }

    public string Name { get; set; } = string.Empty;

    public List<SeatResponse> Seats { get; set; } = [];
}

public class SeatResponse
{
    public Guid Id { get; set; }

    public Guid RoomId { get; set; }

    public string Row { get; set; } = string.Empty;

    public int Number { get; set; }
}
