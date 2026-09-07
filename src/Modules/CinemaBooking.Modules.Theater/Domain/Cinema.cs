namespace CinemaBooking.Modules.Theater.Domain;

public class Cinema
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public string? ProvinceCode { get; set; }

    public string? ProvinceName { get; set; }

    public string? WardCode { get; set; }

    public string? WardName { get; set; }

    public string? AddressLine { get; set; }

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<Room> Rooms { get; set; } = new List<Room>();
}
