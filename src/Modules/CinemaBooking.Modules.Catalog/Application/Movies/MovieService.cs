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
    private const int MaximumPublicIdLength = 255;

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
            request.PosterPublicId,
            request.TrailerUrl);

        var genres =
            await GetGenresForMovieAsync(
                request.GenreIds,
                request.GenreId);
        var primaryGenre = genres.FirstOrDefault();

        var movie = new Movie
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            DurationMinutes = request.DurationMinutes,
            ReleaseDate = request.ReleaseDate,
            PosterUrl = NormalizeOptional(request.PosterUrl),
            PosterPublicId = NormalizeOptional(request.PosterPublicId),
            TrailerUrl = NormalizeOptional(request.TrailerUrl),
            GenreId = primaryGenre?.Id,
            Genre = primaryGenre?.Name,
            IsActive = request.IsActive
        };

        SetMovieGenres(movie, genres);

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
                request.PosterPublicId,
                request.TrailerUrl);
        }

        var genreIds = requests
            .SelectMany(request =>
                ResolveRequestedGenreIds(
                    request.GenreIds,
                    request.GenreId))
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
            .Select(request =>
            {
                var requestedGenreIds =
                    ResolveRequestedGenreIds(
                        request.GenreIds,
                        request.GenreId)
                    .ToArray();
                var primaryGenreId =
                    requestedGenreIds.FirstOrDefault();
                var primaryGenre =
                    primaryGenreId == Guid.Empty
                        ? null
                        : genresById.GetValueOrDefault(primaryGenreId);

                return new Movie
                {
                    Id = Guid.NewGuid(),
                    Title = request.Title.Trim(),
                    Description = request.Description.Trim(),
                    DurationMinutes = request.DurationMinutes,
                    ReleaseDate = request.ReleaseDate,
                    PosterUrl = NormalizeOptional(request.PosterUrl),
                    PosterPublicId = NormalizeOptional(request.PosterPublicId),
                    TrailerUrl = NormalizeOptional(request.TrailerUrl),
                    GenreId = primaryGenre?.Id,
                    Genre = primaryGenre?.Name,
                    IsActive = request.IsActive,
                    MovieGenres = requestedGenreIds
                    .Where(genresById.ContainsKey)
                    .Select(genreId => new MovieGenre
                    {
                        GenreId = genreId,
                        CreatedAt = DateTime.UtcNow
                    })
                    .ToList()
                };
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
            request.PosterPublicId,
            request.TrailerUrl);

        var genres =
            await GetGenresForMovieAsync(
                request.GenreIds,
                request.GenreId);
        var primaryGenre = genres.FirstOrDefault();

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
        movie.PosterPublicId = NormalizeOptional(request.PosterPublicId);
        movie.TrailerUrl = NormalizeOptional(request.TrailerUrl);
        movie.GenreId = primaryGenre?.Id;
        movie.Genre = primaryGenre?.Name;
        movie.IsActive = request.IsActive;
        SetMovieGenres(movie, genres);

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
            PosterPublicId = movie.PosterPublicId,
            TrailerUrl = movie.TrailerUrl,
            GenreId = GetPrimaryGenre(movie)?.Id ?? movie.GenreId,
            Genre = GetPrimaryGenre(movie)?.Name ?? movie.GenreRef?.Name ?? movie.Genre,
            Genres = GetMovieGenres(movie),
            IsActive = movie.IsActive
        };
    }

    private async Task<List<Genre>> GetGenresForMovieAsync(
        IReadOnlyCollection<Guid>? genreIds,
        Guid? legacyGenreId,
        CancellationToken cancellationToken = default)
    {
        var requestedGenreIds =
            ResolveRequestedGenreIds(
                    genreIds,
                    legacyGenreId)
                .ToArray();

        var genres = new List<Genre>();

        foreach (var genreId in requestedGenreIds)
        {
            var genre =
                await GetGenreForMovieAsync(
                    genreId,
                    cancellationToken);

            if (genre is not null)
            {
                genres.Add(genre);
            }
        }

        return genres;
    }

    private static IEnumerable<Guid> ResolveRequestedGenreIds(
        IReadOnlyCollection<Guid>? genreIds,
        Guid? legacyGenreId)
    {
        var ids = genreIds is { Count: > 0 }
            ? genreIds
            : legacyGenreId is not null
                ? [legacyGenreId.Value]
                : [];

        return ids
            .Where(id => id != Guid.Empty)
            .Distinct();
    }

    private static void SetMovieGenres(
        Movie movie,
        IReadOnlyCollection<Genre> genres)
    {
        movie.MovieGenres.Clear();

        foreach (var genre in genres)
        {
            movie.MovieGenres.Add(new MovieGenre
            {
                MovieId = movie.Id,
                GenreId = genre.Id,
                CreatedAt = DateTime.UtcNow
            });
        }
    }

    private static Genre? GetPrimaryGenre(Movie movie)
    {
        return movie.MovieGenres
            .OrderBy(movieGenre => movieGenre.CreatedAt)
            .Select(movieGenre => movieGenre.Genre)
            .FirstOrDefault(genre => genre is not null);
    }

    private static IReadOnlyList<MovieGenreResponse> GetMovieGenres(Movie movie)
    {
        var genres = movie.MovieGenres
            .OrderBy(movieGenre => movieGenre.CreatedAt)
            .Select(movieGenre => movieGenre.Genre)
            .Where(genre => genre is not null)
            .Select(genre => new MovieGenreResponse
            {
                Id = genre!.Id,
                Name = genre.Name,
                Slug = genre.Slug
            })
            .ToList();

        if (genres.Count == 0 &&
            movie.GenreRef is not null)
        {
            genres.Add(new MovieGenreResponse
            {
                Id = movie.GenreRef.Id,
                Name = movie.GenreRef.Name,
                Slug = movie.GenreRef.Slug
            });
        }

        return genres;
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
        string? posterPublicId,
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

        if (!string.IsNullOrWhiteSpace(posterPublicId) &&
            posterPublicId.Trim().Length > MaximumPublicIdLength)
        {
            throw new BusinessRuleException(
                $"Poster public id must be {MaximumPublicIdLength} characters or fewer.");
        }

        if (!string.IsNullOrWhiteSpace(trailerUrl) &&
            trailerUrl.Trim().Length > MaximumUrlLength)
        {
            throw new BusinessRuleException(
                $"Trailer URL must be {MaximumUrlLength} characters or fewer.");
        }

        if (!IsValidYouTubeUrl(trailerUrl))
        {
            throw new BusinessRuleException(
                "Trailer URL must be a valid YouTube URL.");
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

    private static bool IsValidYouTubeUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return true;
        }

        if (!Uri.TryCreate(
                url.Trim(),
                UriKind.Absolute,
                out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp &&
                uri.Scheme != Uri.UriSchemeHttps))
        {
            return false;
        }

        var host = uri.Host.ToLowerInvariant();

        if (host == "youtu.be")
        {
            return !string.IsNullOrWhiteSpace(
                uri.AbsolutePath.Trim('/'));
        }

        if (host is not ("youtube.com" or "www.youtube.com" or "m.youtube.com"))
        {
            return false;
        }

        if (uri.AbsolutePath == "/watch")
        {
            return !string.IsNullOrWhiteSpace(
                GetQueryValue(uri, "v"));
        }

        if (uri.AbsolutePath.StartsWith(
                "/shorts/",
                StringComparison.OrdinalIgnoreCase) ||
            uri.AbsolutePath.StartsWith(
                "/embed/",
                StringComparison.OrdinalIgnoreCase))
        {
            return !string.IsNullOrWhiteSpace(
                uri.AbsolutePath.Split(
                    '/',
                    StringSplitOptions.RemoveEmptyEntries)
                    .ElementAtOrDefault(1));
        }

        return false;
    }

    private static string? GetQueryValue(
        Uri uri,
        string key)
    {
        var query = uri.Query.TrimStart('?');

        if (string.IsNullOrWhiteSpace(query))
        {
            return null;
        }

        foreach (var part in query.Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var pair = part.Split('=', 2);

            if (pair.Length == 2 &&
                string.Equals(
                    Uri.UnescapeDataString(pair[0]),
                    key,
                    StringComparison.OrdinalIgnoreCase))
            {
                return Uri.UnescapeDataString(pair[1]);
            }
        }

        return null;
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}
