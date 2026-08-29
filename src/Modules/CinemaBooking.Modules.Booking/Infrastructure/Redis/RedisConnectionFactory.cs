using StackExchange.Redis;

namespace CinemaBooking.Modules.Booking.Infrastructure.Redis;

public static class RedisConnectionFactory
{
    public static IConnectionMultiplexer Connect(string connectionString)
    {
        return ConnectionMultiplexer.Connect(
            Parse(connectionString));
    }

    private static ConfigurationOptions Parse(string connectionString)
    {
        if (!Uri.TryCreate(connectionString, UriKind.Absolute, out var uri) ||
            (uri.Scheme != "redis" && uri.Scheme != "rediss"))
        {
            return ConfigurationOptions.Parse(connectionString);
        }

        if (string.IsNullOrWhiteSpace(uri.Host) || uri.Port <= 0)
        {
            throw new InvalidOperationException(
                "Redis connection string must include host and port.");
        }

        var options = new ConfigurationOptions
        {
            User = "default",
            AbortOnConnectFail = false,
            Ssl = uri.Scheme == "rediss"
        };

        options.EndPoints.Add(uri.Host, uri.Port);

        var userInfo = uri.UserInfo.Split(':', 2);

        if (userInfo.Length == 2)
        {
            options.User = Uri.UnescapeDataString(userInfo[0]);
            options.Password = Uri.UnescapeDataString(userInfo[1]);
        }
        else if (userInfo.Length == 1 &&
                 !string.IsNullOrWhiteSpace(userInfo[0]))
        {
            options.Password = Uri.UnescapeDataString(userInfo[0]);
        }

        return options;
    }
}
