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
        string? provinceCode = null,
        string? wardCode = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CinemaInfo>> GetCinemasByIdsAsync(
        IReadOnlyCollection<Guid> cinemaIds,
        CancellationToken cancellationToken = default);

    Task<CinemaInfo> CreateCinemaAsync(
        string name,
        string address,
        string city,
        string? description,
        string? imageUrl = null,
        string? provinceCode = null,
        string? provinceName = null,
        string? wardCode = null,
        string? wardName = null,
        string? addressLine = null,
        CancellationToken cancellationToken = default);

    Task UpdateCinemaAsync(
        Guid cinemaId,
        string name,
        string address,
        string city,
        string? description,
        string? imageUrl,
        bool isActive,
        string? provinceCode = null,
        string? provinceName = null,
        string? wardCode = null,
        string? wardName = null,
        string? addressLine = null,
        CancellationToken cancellationToken = default);

    Task<RoomInfo?> GetRoomAsync(
        Guid roomId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RoomInfo>> GetRoomsByCinemaAsync(
        Guid cinemaId,
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
