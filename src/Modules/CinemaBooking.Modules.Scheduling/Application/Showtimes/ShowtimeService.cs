using CinemaBooking.Modules.Catalog.Contracts;
using CinemaBooking.Modules.Scheduling.Application.Interfaces;
using CinemaBooking.Modules.Scheduling.Domain;
using CinemaBooking.Modules.Theater.Contracts;
using CinemaBooking.SharedKernel.Exceptions;

namespace CinemaBooking.Modules.Scheduling.Application.Showtimes;

public class ShowtimeService
{
    private readonly IShowtimeRepository _repository;
    private readonly ICatalogModule _catalogModule;
    private readonly ITheaterModule _theaterModule;

    public ShowtimeService(
        IShowtimeRepository repository,
        ICatalogModule catalogModule,
        ITheaterModule theaterModule)
    {
        _repository = repository;
        _catalogModule = catalogModule;
        _theaterModule = theaterModule;
    }

    public async Task<ShowtimeResponse> CreateAsync(
        CreateShowtimeRequest request)
    {
        if (request.EndTime <= request.StartTime)
        {
            throw new BusinessRuleException(
                "End time must be greater than start time.");
        }

        var movieExists =
            await _catalogModule.MovieExistsAsync(request.MovieId);

        if (!movieExists)
        {
            throw new NotFoundException("Movie not found.");
        }

        var roomExists =
            await _theaterModule.RoomExistsAsync(request.RoomId);

        if (!roomExists)
        {
            throw new NotFoundException("Room not found.");
        }

        var hasOverlap =
            await _repository.HasOverlappingShowtimeAsync(
                request.RoomId,
                request.StartTime,
                request.EndTime);

        if (hasOverlap)
        {
            throw new ConflictException(
                "The room already has an overlapping showtime.");
        }

        var showtime = new Showtime
        {
            MovieId = request.MovieId,
            RoomId = request.RoomId,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            BasePrice = request.BasePrice
        };

        await _repository.AddAsync(showtime);

        return ToResponse(showtime);
    }

    public async Task<ShowtimeResponse?> GetByIdAsync(Guid id)
    {
        var showtime = await _repository.GetByIdAsync(id);

        return showtime is null
            ? null
            : ToResponse(showtime);
    }

    public async Task<List<ShowtimeResponse>> GetAllAsync()
    {
        var showtimes = await _repository.GetAllAsync();

        return showtimes
            .Select(ToResponse)
            .ToList();
    }

    private static ShowtimeResponse ToResponse(Showtime showtime)
    {
        return new ShowtimeResponse
        {
            Id = showtime.Id,
            MovieId = showtime.MovieId,
            RoomId = showtime.RoomId,
            StartTime = showtime.StartTime,
            EndTime = showtime.EndTime,
            BasePrice = showtime.BasePrice
        };
    }
}
