namespace CinemaBooking.Modules.Theater.Domain;

public class Cinema
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public ICollection<Room> Rooms { get; set; } = new List<Room>();
}
