using CinemaBooking.Modules.Catalog.Contracts;
using CinemaBooking.Modules.Scheduling.Application.Interfaces;
using CinemaBooking.Modules.Scheduling.Domain;
using CinemaBooking.Modules.Theater.Contracts;
using CinemaBooking.SharedKernel.Exceptions;

namespace CinemaBooking.Modules.Scheduling.Application.Showtimes;

public class ShowtimeService
{
    private const int MaximumBulkShowtimes = 100;

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
        CreateShowtimeRequest request,
        CancellationToken cancellationToken = default)
    {
        return await _repository.ExecuteInSerializableTransactionAsync(
            token => CreateCoreAsync(request, token),
            cancellationToken);
    }

    public async Task<BulkCreateShowtimesResult> BulkCreateAsync(
        BulkCreateShowtimesRequest request,
        CancellationToken cancellationToken = default)
    {
        return await _repository.ExecuteInSerializableTransactionAsync(
            token => BulkCreateCoreAsync(request, token),
            cancellationToken);
    }

    private async Task<ShowtimeResponse> CreateCoreAsync(
        CreateShowtimeRequest request,
        CancellationToken cancellationToken)
    {
        var movie =
            await GetValidMovieAsync(
                request.MovieId,
                cancellationToken);

        await EnsureValidRoomAndPriceAsync(
            request.RoomId,
            request.BasePrice,
            cancellationToken);

        var endTime =
            request.StartTime.AddMinutes(movie.DurationMinutes);

        var hasOverlap =
            await _repository.HasOverlappingShowtimeAsync(
                request.RoomId,
                request.StartTime,
                endTime,
                cancellationToken);

        if (hasOverlap)
        {
            throw new ConflictException(
                "The room already has an overlapping showtime.");
        }

        var showtime = new Showtime
        {
            Id = Guid.NewGuid(),
            MovieId = request.MovieId,
            RoomId = request.RoomId,
            StartTime = request.StartTime,
            EndTime = endTime,
            BasePrice = request.BasePrice
        };

        await _repository.AddAsync(
            showtime,
            cancellationToken);

        return ToResponse(showtime);
    }

    private async Task<BulkCreateShowtimesResult> BulkCreateCoreAsync(
        BulkCreateShowtimesRequest request,
        CancellationToken cancellationToken)
    {
        if (request.StartTimes is null || request.StartTimes.Count == 0)
        {
            throw new BusinessRuleException(
                "At least one start time is required.");
        }

        if (request.StartTimes.Count > MaximumBulkShowtimes)
        {
            throw new BusinessRuleException(
                $"A maximum of {MaximumBulkShowtimes} showtimes can be created at once.");
        }

        if (request.StartTimes.Distinct().Count() !=
            request.StartTimes.Count)
        {
            throw new BusinessRuleException(
                "Duplicate start times are not allowed.");
        }

        var movie =
            await GetValidMovieAsync(
                request.MovieId,
                cancellationToken);

        await EnsureValidRoomAndPriceAsync(
            request.RoomId,
            request.BasePrice,
            cancellationToken);

        var duration =
            TimeSpan.FromMinutes(movie.DurationMinutes);

        var candidates = request.StartTimes
            .OrderBy(startTime => startTime)
            .Select(startTime => new ShowtimeCandidate(
                startTime,
                startTime.Add(duration)))
            .ToArray();

        EnsureCandidatesDoNotOverlap(candidates);

        var existingShowtimes =
            await _repository.GetOverlappingAsync(
                request.RoomId,
                candidates.Min(candidate => candidate.Start),
                candidates.Max(candidate => candidate.End),
                cancellationToken);

        foreach (var candidate in candidates)
        {
            var hasConflict =
                existingShowtimes.Any(showtime =>
                    showtime.StartTime < candidate.End &&
                    showtime.EndTime > candidate.Start);

            if (hasConflict)
            {
                throw new ConflictException(
                    $"Showtime starting at {candidate.Start:u} overlaps an existing showtime.");
            }
        }

        var showtimes = candidates
            .Select(candidate => new Showtime
            {
                Id = Guid.NewGuid(),
                MovieId = request.MovieId,
                RoomId = request.RoomId,
                StartTime = candidate.Start,
                EndTime = candidate.End,
                BasePrice = request.BasePrice
            })
            .ToList();

        await _repository.AddRangeAsync(
            showtimes,
            cancellationToken);

        return new BulkCreateShowtimesResult(
            showtimes.Count,
            showtimes.Select(showtime => showtime.Id).ToArray());
    }

    private async Task<MovieInfo> GetValidMovieAsync(
        Guid movieId,
        CancellationToken cancellationToken)
    {
        var movie =
            await _catalogModule.GetMovieAsync(
                movieId,
                cancellationToken);

        if (movie is null)
        {
            throw new NotFoundException("Movie not found.");
        }

        if (!movie.IsActive)
        {
            throw new BusinessRuleException(
                "Cannot create showtime for an inactive movie.");
        }

        return movie;
    }

    private async Task EnsureValidRoomAndPriceAsync(
        Guid roomId,
        decimal basePrice,
        CancellationToken cancellationToken)
    {
        if (basePrice <= 0)
        {
            throw new BusinessRuleException(
                "Base price must be greater than zero.");
        }

        var roomExists =
            await _theaterModule.RoomExistsAsync(
                roomId,
                cancellationToken);

        if (!roomExists)
        {
            throw new NotFoundException("Room not found.");
        }
    }

    private static void EnsureCandidatesDoNotOverlap(
        IReadOnlyList<ShowtimeCandidate> candidates)
    {
        for (var i = 1; i < candidates.Count; i++)
        {
            var previous = candidates[i - 1];
            var current = candidates[i];

            if (previous.End > current.Start)
            {
                throw new ConflictException(
                    "Requested showtimes overlap each other.");
            }
        }
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

    private sealed record ShowtimeCandidate(
        DateTime Start,
        DateTime End);
}
