namespace CinemaBooking.Modules.Theater.Domain;

public class Room
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public Guid CinemaId { get; set; }

    public Cinema Cinema { get; set; } = null!;

    public ICollection<Seat> Seats { get; set; } = new List<Seat>();
}
