using Testcontainers.Redis;

namespace CinemaBooking.IntegrationTests;

public sealed class RedisContainerFixture : IAsyncLifetime
{
    private readonly RedisContainer _redis =
        new RedisBuilder("redis:7-alpine")
            .Build();

    public string ConnectionString => _redis.GetConnectionString();

    public async Task InitializeAsync()
    {
        await _redis.StartAsync();
    }

    public async Task DisposeAsync()
    {
        await _redis.DisposeAsync();
    }
}
