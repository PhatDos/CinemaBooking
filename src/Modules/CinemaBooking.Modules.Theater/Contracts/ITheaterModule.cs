namespace CinemaBooking.Modules.Theater.Contracts;

public interface ITheaterModule
{
    Task<bool> CinemaExistsAsync(
        Guid cinemaId,
        CancellationToken cancellationToken = default);

    Task<CinemaInfo?> GetCinemaAsync(
        Guid cinemaId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CinemaInfo>> GetCinemasAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CinemaInfo>> GetCinemasByIdsAsync(
        IReadOnlyCollection<Guid> cinemaIds,
        CancellationToken cancellationToken = default);

    Task<CinemaInfo> CreateCinemaAsync(
        string name,
        string address,
        string city,
        string? description,
        CancellationToken cancellationToken = default);

    Task UpdateCinemaAsync(
        Guid cinemaId,
        string name,
        string address,
        string city,
        string? description,
        bool isActive,
        CancellationToken cancellationToken = default);

    Task<RoomInfo?> GetRoomAsync(
        Guid roomId,
        CancellationToken cancellationToken = default);

    Task<bool> RoomExistsAsync(
        Guid roomId,
        CancellationToken cancellationToken = default);

    Task<bool> SeatBelongsToRoomAsync(
        Guid seatId,
        Guid roomId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SeatInfo>> GetSeatsByRoomAsync(
        Guid roomId,
        CancellationToken cancellationToken = default);
}
