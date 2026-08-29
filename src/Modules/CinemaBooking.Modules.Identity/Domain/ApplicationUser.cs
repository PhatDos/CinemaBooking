using Microsoft.AspNetCore.Identity;

namespace CinemaBooking.Modules.Identity.Domain;

public class ApplicationUser : IdentityUser<Guid>
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
