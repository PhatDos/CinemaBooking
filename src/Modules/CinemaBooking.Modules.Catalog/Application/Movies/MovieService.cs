using CinemaBooking.Modules.Catalog.Application.Interfaces;
using CinemaBooking.Modules.Catalog.Domain;
using CinemaBooking.SharedKernel.Exceptions;

namespace CinemaBooking.Modules.Catalog.Application.Movies;

public class MovieService
{
    private const int MaximumTitleLength = 200;
    private const int MaximumDescriptionLength = 4000;
    private const int MaximumDurationMinutes = 500;
    private const int MaximumUrlLength = 1000;

    private readonly IMovieRepository _movieRepository;
    private readonly IGenreRepository _genreRepository;

    public MovieService(
        IMovieRepository movieRepository,
        IGenreRepository genreRepository)
    {
        _movieRepository = movieRepository;
        _genreRepository = genreRepository;
    }

    public async Task<List<MovieResponse>> GetAllAsync(
        bool includeInactive = false)
    {
        var movies = await _movieRepository.GetAllAsync();

        return movies
            .Where(movie => includeInactive || movie.IsActive)
            .Select(ToResponse)
            .ToList();
    }

    public async Task<MovieResponse?> GetByIdAsync(Guid id)
    {
        var movie = await _movieRepository.GetByIdAsync(id);

        if (movie is null)
        {
            return null;
        }

        return ToResponse(movie);
    }

    public async Task<MovieResponse> CreateAsync(CreateMovieRequest request)
    {
        ValidateMovie(
            request.Title,
            request.Description,
            request.DurationMinutes,
            request.ReleaseDate,
            request.PosterUrl,
            request.TrailerUrl);

        var genre =
            await GetGenreForMovieAsync(request.GenreId);

        var movie = new Movie
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            DurationMinutes = request.DurationMinutes,
            ReleaseDate = request.ReleaseDate,
            PosterUrl = NormalizeOptional(request.PosterUrl),
            TrailerUrl = NormalizeOptional(request.TrailerUrl),
            GenreId = genre?.Id,
            Genre = genre?.Name,
            IsActive = request.IsActive
        };

        await _movieRepository.AddAsync(movie);

        return ToResponse(movie);
    }

    public async Task<BulkCreateMoviesResult> BulkCreateAsync(
        IReadOnlyCollection<CreateMovieRequest>? requests,
        CancellationToken cancellationToken = default)
    {
        if (requests is null || requests.Count == 0)
        {
            throw new BusinessRuleException(
                "At least one movie is required.");
        }

        if (requests.Count > 100)
        {
            throw new BusinessRuleException(
                "A maximum of 100 movies can be created at once.");
        }

        foreach (var request in requests)
        {
            ValidateMovie(
                request.Title,
                request.Description,
                request.DurationMinutes,
                request.ReleaseDate,
                request.PosterUrl,
                request.TrailerUrl);
        }

        var genreIds = requests
            .Where(request => request.GenreId is not null)
            .Select(request => request.GenreId!.Value)
            .Distinct()
            .ToArray();

        var genresById = new Dictionary<Guid, Genre>();

        foreach (var genreId in genreIds)
        {
            var genre =
                await GetGenreForMovieAsync(
                    genreId,
                    cancellationToken);

            if (genre is not null)
            {
                genresById[genre.Id] = genre;
            }
        }

        var movies = requests
            .Select(request => new Movie
            {
                Id = Guid.NewGuid(),
                Title = request.Title.Trim(),
                Description = request.Description.Trim(),
                DurationMinutes = request.DurationMinutes,
                ReleaseDate = request.ReleaseDate,
                PosterUrl = NormalizeOptional(request.PosterUrl),
                TrailerUrl = NormalizeOptional(request.TrailerUrl),
                GenreId = request.GenreId,
                Genre = request.GenreId is not null &&
                        genresById.TryGetValue(
                            request.GenreId.Value,
                            out var genre)
                    ? genre.Name
                    : null,
                IsActive = request.IsActive
            })
            .ToList();

        await _movieRepository.AddRangeAsync(
            movies,
            cancellationToken);

        return new BulkCreateMoviesResult(
            movies.Count,
            movies.Select(movie => movie.Id).ToArray());
    }

    public async Task UpdateAsync(
        Guid id,
        UpdateMovieRequest request)
    {
        ValidateMovie(
            request.Title,
            request.Description,
            request.DurationMinutes,
            request.ReleaseDate,
            request.PosterUrl,
            request.TrailerUrl);

        var genre =
            await GetGenreForMovieAsync(request.GenreId);

        var movie =
            await _movieRepository.GetByIdForUpdateAsync(id);

        if (movie is null)
        {
            throw new NotFoundException("Movie was not found.");
        }

        movie.Title = request.Title.Trim();
        movie.Description = request.Description.Trim();
        movie.DurationMinutes = request.DurationMinutes;
        movie.ReleaseDate = request.ReleaseDate;
        movie.PosterUrl = NormalizeOptional(request.PosterUrl);
        movie.TrailerUrl = NormalizeOptional(request.TrailerUrl);
        movie.GenreId = genre?.Id;
        movie.Genre = genre?.Name;
        movie.IsActive = request.IsActive;

        await _movieRepository.SaveChangesAsync();
    }

    private static MovieResponse ToResponse(Movie movie)
    {
        return new MovieResponse
        {
            Id = movie.Id,
            Title = movie.Title,
            Description = movie.Description,
            DurationMinutes = movie.DurationMinutes,
            ReleaseDate = movie.ReleaseDate,
            PosterUrl = movie.PosterUrl,
            TrailerUrl = movie.TrailerUrl,
            GenreId = movie.GenreId,
            Genre = movie.GenreRef?.Name ?? movie.Genre,
            IsActive = movie.IsActive
        };
    }

    private async Task<Genre?> GetGenreForMovieAsync(
        Guid? genreId,
        CancellationToken cancellationToken = default)
    {
        if (genreId is null)
        {
            return null;
        }

        if (genreId == Guid.Empty)
        {
            throw new BusinessRuleException("Genre id is required.");
        }

        var genre =
            await _genreRepository.GetByIdAsync(
                genreId.Value,
                cancellationToken);

        if (genre is null)
        {
            throw new NotFoundException("Genre was not found.");
        }

        return genre;
    }

    private static void ValidateMovie(
        string? title,
        string? description,
        int durationMinutes,
        DateTime releaseDate,
        string? posterUrl,
        string? trailerUrl)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new BusinessRuleException(
                "Movie title is required.");
        }

        if (title.Trim().Length > MaximumTitleLength)
        {
            throw new BusinessRuleException(
                $"Movie title must be {MaximumTitleLength} characters or fewer.");
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new BusinessRuleException(
                "Movie description is required.");
        }

        if (description.Trim().Length > MaximumDescriptionLength)
        {
            throw new BusinessRuleException(
                $"Movie description must be {MaximumDescriptionLength} characters or fewer.");
        }

        if (durationMinutes <= 0)
        {
            throw new BusinessRuleException(
                "Duration must be greater than zero.");
        }

        if (durationMinutes > MaximumDurationMinutes)
        {
            throw new BusinessRuleException(
                $"Duration must be {MaximumDurationMinutes} minutes or fewer.");
        }

        if (releaseDate == default)
        {
            throw new BusinessRuleException(
                "Release date is required.");
        }

        if (!string.IsNullOrWhiteSpace(posterUrl) &&
            posterUrl.Trim().Length > MaximumUrlLength)
        {
            throw new BusinessRuleException(
                $"Poster URL must be {MaximumUrlLength} characters or fewer.");
        }

        if (!IsValidUrl(posterUrl))
        {
            throw new BusinessRuleException(
                "Poster URL must be a valid HTTP or HTTPS URL.");
        }

        if (!string.IsNullOrWhiteSpace(trailerUrl) &&
            trailerUrl.Trim().Length > MaximumUrlLength)
        {
            throw new BusinessRuleException(
                $"Trailer URL must be {MaximumUrlLength} characters or fewer.");
        }

        if (!IsValidUrl(trailerUrl))
        {
            throw new BusinessRuleException(
                "Trailer URL must be a valid HTTP or HTTPS URL.");
        }

    }

    private static bool IsValidUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return true;
        }

        return Uri.TryCreate(
                url,
                UriKind.Absolute,
                out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp ||
                uri.Scheme == Uri.UriSchemeHttps);
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}
