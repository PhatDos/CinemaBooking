using CinemaBooking.Modules.Catalog.Application.Interfaces;
using CinemaBooking.Modules.Catalog.Domain;
using CinemaBooking.SharedKernel.Exceptions;

namespace CinemaBooking.Modules.Catalog.Application.Movies;

public class MovieService
{
    private readonly IMovieRepository _movieRepository;

    public MovieService(IMovieRepository movieRepository)
    {
        _movieRepository = movieRepository;
    }

    public async Task<List<MovieResponse>> GetAllAsync()
    {
        var movies = await _movieRepository.GetAllAsync();

        return movies
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
            request.PosterUrl,
            request.TrailerUrl);

        var movie = new Movie
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            DurationMinutes = request.DurationMinutes,
            ReleaseDate = request.ReleaseDate,
            PosterUrl = NormalizeOptional(request.PosterUrl),
            TrailerUrl = NormalizeOptional(request.TrailerUrl),
            Genre = NormalizeOptional(request.Genre),
            IsActive = true
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
                request.PosterUrl,
                request.TrailerUrl);
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
                Genre = NormalizeOptional(request.Genre),
                IsActive = true
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
            request.PosterUrl,
            request.TrailerUrl);

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
        movie.Genre = NormalizeOptional(request.Genre);
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
            Genre = movie.Genre,
            IsActive = movie.IsActive
        };
    }

    private static void ValidateMovie(
        string? title,
        string? description,
        int durationMinutes,
        string? posterUrl,
        string? trailerUrl)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new BusinessRuleException(
                "Movie title is required.");
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new BusinessRuleException(
                "Movie description is required.");
        }

        if (durationMinutes <= 0)
        {
            throw new BusinessRuleException(
                "Duration must be greater than zero.");
        }

        if (!IsValidUrl(posterUrl))
        {
            throw new BusinessRuleException(
                "Poster URL must be a valid HTTP or HTTPS URL.");
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
