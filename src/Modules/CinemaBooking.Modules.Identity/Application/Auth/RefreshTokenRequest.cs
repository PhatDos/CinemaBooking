using System.ComponentModel.DataAnnotations;

namespace CinemaBooking.Modules.Identity.Application.Auth;

public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
