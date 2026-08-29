using CinemaBooking.Modules.Identity.Domain;

namespace CinemaBooking.Modules.Identity.Application.Interfaces;

public interface IJwtTokenGenerator
{
    Task<string> GenerateAsync(ApplicationUser user);
}
