namespace CinemaBooking.SharedKernel.Caching;

public interface IAppCache
{
    Task<T> GetOrCreateAsync<T>(
        string key,
        IReadOnlyCollection<string> tags,
        TimeSpan ttl,
        Func<CancellationToken, Task<T>> factory,
        CancellationToken cancellationToken = default);

    Task RemoveAsync(
        string key,
        CancellationToken cancellationToken = default);

    Task InvalidateTagsAsync(
        IReadOnlyCollection<string> tags,
        CancellationToken cancellationToken = default);
}
