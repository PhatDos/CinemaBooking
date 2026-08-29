namespace CinemaBooking.Modules.Theater.Contracts;

public interface ITheaterModule
{
    Task<bool> RoomExistsAsync(Guid roomId);

    Task<bool> SeatBelongsToRoomAsync(Guid seatId, Guid roomId);

    Task<IReadOnlyList<SeatInfo>> GetSeatsByRoomAsync(Guid roomId);
}
