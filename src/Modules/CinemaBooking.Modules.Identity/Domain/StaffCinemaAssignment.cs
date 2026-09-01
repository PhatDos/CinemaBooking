namespace CinemaBooking.Modules.Identity.Domain;

public sealed class StaffCinemaAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public Guid CinemaId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
