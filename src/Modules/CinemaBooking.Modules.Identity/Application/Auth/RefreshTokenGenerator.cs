using System.Security.Cryptography;
using System.Text;

namespace CinemaBooking.Modules.Identity.Application.Auth;

public static class RefreshTokenGenerator
{
    public static string Generate()
    {
        return Convert.ToBase64String(
            RandomNumberGenerator.GetBytes(64));
    }

    public static string Hash(string token)
    {
        var bytes =
            SHA256.HashData(
                Encoding.UTF8.GetBytes(token));

        return Convert.ToHexString(bytes);
    }
}
