using CinemaBooking.Modules.Catalog.Application.Movies;
using CinemaBooking.Modules.Catalog.Domain;
using CinemaBooking.Modules.Catalog.Domain.Imports;
using CinemaBooking.Modules.Catalog.Infrastructure.Persistence;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.Modules.Catalog.Application.MovieImports;

public sealed class MovieImportService
{
    private const string MoveekSource = MoveekMovieImportProvider.ProviderSource;

    private readonly CatalogDbContext _dbContext;
    private readonly IEnumerable<IMovieImportProvider> _providers;
    private readonly IMoviePosterImporter _posterImporter;

    public MovieImportService(
        CatalogDbContext dbContext,
        IEnumerable<IMovieImportProvider> providers,
        IMoviePosterImporter posterImporter)
    {
        _dbContext = dbContext;
        _providers = providers;
        _posterImporter = posterImporter;
    }

    public async Task<MovieImportBatchResponse> DiscoverAsync(
        MovieImportRunRequest request,
        CancellationToken cancellationToken = default)
    {
        var provider = ResolveProvider(request.Source);
        var batch = await CreateBatchAsync(provider.Source, cancellationToken);

        try
        {
            await DiscoverIntoBatchAsync(
                batch,
                provider,
                cancellationToken);

            batch.Status = MovieImportBatchStatus.Completed;
            batch.FinishedAt = DateTime.UtcNow;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            batch.Status = MovieImportBatchStatus.Failed;
            batch.FinishedAt = DateTime.UtcNow;
            batch.Error = ex.Message;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetBatchAsync(batch.Id, cancellationToken)
            ?? throw new NotFoundException("Movie import batch was not found.");
    }

    public async Task<MovieImportBatchResponse> RunAsync(
        MovieImportRunRequest request,
        CancellationToken cancellationToken = default)
    {
        var provider = ResolveProvider(request.Source);
        var batch = await CreateBatchAsync(provider.Source, cancellationToken);

        try
        {
            await DiscoverIntoBatchAsync(
                batch,
                provider,
                cancellationToken);
            await CrawlBatchCoreAsync(
                batch,
                provider,
                cancellationToken);

            batch.Status = MovieImportBatchStatus.Completed;
            batch.FinishedAt = DateTime.UtcNow;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            batch.Status = MovieImportBatchStatus.Failed;
            batch.FinishedAt = DateTime.UtcNow;
            batch.Error = ex.Message;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetBatchAsync(batch.Id, cancellationToken)
            ?? throw new NotFoundException("Movie import batch was not found.");
    }

    public async Task<MovieImportBatchResponse> CrawlBatchAsync(
        Guid batchId,
        CancellationToken cancellationToken = default)
    {
        var batch = await _dbContext.MovieImportBatches
            .FirstOrDefaultAsync(
                item => item.Id == batchId,
                cancellationToken);

        if (batch is null)
        {
            throw new NotFoundException("Movie import batch was not found.");
        }

        var provider = ResolveProvider(batch.Source);

        await CrawlBatchCoreAsync(
            batch,
            provider,
            cancellationToken);

        batch.Status = MovieImportBatchStatus.Completed;
        batch.FinishedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetBatchAsync(batch.Id, cancellationToken)
            ?? throw new NotFoundException("Movie import batch was not found.");
    }

    public async Task<MovieImportCandidateResponse> CrawlCandidateAsync(
        Guid candidateId,
        CancellationToken cancellationToken = default)
    {
        var candidate = await LoadCandidateForUpdateAsync(
            candidateId,
            cancellationToken);

        if (candidate is null)
        {
            throw new NotFoundException("Movie import candidate was not found.");
        }

        var provider = ResolveProvider(candidate.Source);

        await CrawlCandidateCoreAsync(
            candidate,
            provider,
            cancellationToken);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await LoadCandidateResponseAsync(
            candidate.Id,
            cancellationToken)
            ?? throw new NotFoundException("Movie import candidate was not found.");
    }

    public async Task<IReadOnlyList<MovieImportBatchResponse>> GetBatchesAsync(
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.MovieImportBatches
            .AsNoTracking()
            .OrderByDescending(batch => batch.StartedAt)
            .Take(20)
            .Select(batch => new MovieImportBatchResponse
            {
                Id = batch.Id,
                Source = batch.Source,
                Status = batch.Status,
                StartedAt = batch.StartedAt,
                FinishedAt = batch.FinishedAt,
                Error = batch.Error,
                CandidateCount = batch.Candidates.Count
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<MovieImportBatchResponse?> GetBatchAsync(
        Guid batchId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.MovieImportBatches
            .AsNoTracking()
            .Where(batch => batch.Id == batchId)
            .Select(batch => new MovieImportBatchResponse
            {
                Id = batch.Id,
                Source = batch.Source,
                Status = batch.Status,
                StartedAt = batch.StartedAt,
                FinishedAt = batch.FinishedAt,
                Error = batch.Error,
                CandidateCount = batch.Candidates.Count
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<MovieImportCandidateResponse>> GetCandidatesAsync(
        Guid batchId,
        CancellationToken cancellationToken = default)
    {
        var exists = await _dbContext.MovieImportBatches
            .AnyAsync(
                batch => batch.Id == batchId,
                cancellationToken);

        if (!exists)
        {
            throw new NotFoundException("Movie import batch was not found.");
        }

        var candidates = await _dbContext.MovieImportCandidates
            .AsNoTracking()
            .Include(candidate => candidate.MatchMovie)
                .ThenInclude(movie => movie!.GenreRef)
            .Include(candidate => candidate.MatchMovie)
                .ThenInclude(movie => movie!.MovieGenres)
                    .ThenInclude(movieGenre => movieGenre.Genre)
            .Where(candidate => candidate.BatchId == batchId)
            .OrderBy(candidate => candidate.Title)
            .ToListAsync(cancellationToken);

        return candidates
            .Select(ToCandidateResponse)
            .ToList();
    }

    public async Task<MovieResponse> ApproveAsync(
        Guid candidateId,
        CancellationToken cancellationToken = default)
    {
        var candidate = await LoadCandidateForUpdateAsync(
            candidateId,
            cancellationToken);

        if (candidate is null)
        {
            throw new NotFoundException("Movie import candidate was not found.");
        }

        if (candidate.Status == MovieImportCandidateStatus.Rejected)
        {
            throw new ConflictException("Rejected import candidate cannot be approved.");
        }

        var genreNames = GetStoredParts(candidate.GenreName);
        var genres = await ResolveGenresAsync(
            genreNames,
            requireAll: true,
            cancellationToken);

        if (candidate.DurationMinutes is null or <= 0)
        {
            throw new BusinessRuleException(
                "Imported movie duration is required before approval.");
        }

        if (candidate.ReleaseDate is null)
        {
            throw new BusinessRuleException(
                "Imported movie release date is required before approval.");
        }

        if (string.IsNullOrWhiteSpace(candidate.Description))
        {
            throw new BusinessRuleException(
                "Imported movie description is required before approval.");
        }

        var poster = !string.IsNullOrWhiteSpace(candidate.PosterUrl)
            ? await _posterImporter.ImportAsync(
                candidate.PosterUrl,
                cancellationToken)
            : null;

        var movie = candidate.MatchMovieId is not null
            ? await _dbContext.Movies
                .Include(item => item.GenreRef)
                .Include(item => item.MovieGenres)
                    .ThenInclude(movieGenre => movieGenre.Genre)
                .FirstOrDefaultAsync(
                    item => item.Id == candidate.MatchMovieId,
                    cancellationToken)
            : null;

        if (movie is null)
        {
            movie = new Movie
            {
                Id = Guid.NewGuid()
            };

            _dbContext.Movies.Add(movie);
        }

        var primaryGenre = genres.FirstOrDefault();

        movie.Title = candidate.Title.Trim();
        movie.Description = candidate.Description.Trim();
        movie.DurationMinutes = candidate.DurationMinutes.Value;
        movie.ReleaseDate = candidate.ReleaseDate.Value;
        movie.TrailerUrl = NormalizeOptional(candidate.TrailerUrl);
        movie.PosterUrl = poster?.PosterUrl ?? NormalizeOptional(candidate.PosterUrl);
        movie.PosterPublicId = poster?.PosterPublicId;
        movie.GenreId = primaryGenre?.Id;
        movie.Genre = primaryGenre?.Name;
        movie.IsActive = true;

        SetMovieGenres(movie, genres);

        await UpsertExternalSourceAsync(
            movie,
            candidate,
            cancellationToken);

        candidate.MatchMovieId = movie.Id;
        candidate.Status = MovieImportCandidateStatus.Approved;
        candidate.DetailError = null;
        candidate.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await LoadMovieResponseAsync(
            movie.Id,
            cancellationToken)
            ?? throw new NotFoundException("Movie was not found.");
    }

    public async Task RejectAsync(
        Guid candidateId,
        CancellationToken cancellationToken = default)
    {
        var candidate = await _dbContext.MovieImportCandidates
            .FirstOrDefaultAsync(
                item => item.Id == candidateId,
                cancellationToken);

        if (candidate is null)
        {
            throw new NotFoundException("Movie import candidate was not found.");
        }

        if (candidate.Status == MovieImportCandidateStatus.Approved)
        {
            throw new ConflictException("Approved import candidate cannot be rejected.");
        }

        candidate.Status = MovieImportCandidateStatus.Rejected;
        candidate.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private IMovieImportProvider ResolveProvider(string? source)
    {
        var normalizedSource = string.IsNullOrWhiteSpace(source)
            ? MoveekSource
            : source.Trim();

        var provider = _providers.FirstOrDefault(item =>
            string.Equals(
                item.Source,
                normalizedSource,
                StringComparison.OrdinalIgnoreCase));

        if (provider is null)
        {
            throw new BusinessRuleException(
                $"Movie import source '{normalizedSource}' is not supported.");
        }

        return provider;
    }

    private async Task<MovieImportBatch> CreateBatchAsync(
        string source,
        CancellationToken cancellationToken)
    {
        var batch = new MovieImportBatch
        {
            Id = Guid.NewGuid(),
            Source = source,
            StartedAt = DateTime.UtcNow,
            Status = MovieImportBatchStatus.Running
        };

        _dbContext.MovieImportBatches.Add(batch);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return batch;
    }

    private async Task DiscoverIntoBatchAsync(
        MovieImportBatch batch,
        IMovieImportProvider provider,
        CancellationToken cancellationToken)
    {
        var listings = await provider.DiscoverAsync(cancellationToken);

        foreach (var listing in listings)
        {
            await UpsertDiscoveredCandidateAsync(
                batch.Id,
                listing,
                cancellationToken);
        }
    }

    private async Task CrawlBatchCoreAsync(
        MovieImportBatch batch,
        IMovieImportProvider provider,
        CancellationToken cancellationToken)
    {
        var candidates = await _dbContext.MovieImportCandidates
            .Where(candidate =>
                candidate.BatchId == batch.Id &&
                candidate.Status != MovieImportCandidateStatus.Approved &&
                candidate.Status != MovieImportCandidateStatus.Rejected)
            .OrderBy(candidate => candidate.Title)
            .ToListAsync(cancellationToken);

        foreach (var candidate in candidates)
        {
            await CrawlCandidateCoreAsync(
                candidate,
                provider,
                cancellationToken);
        }
    }

    private async Task UpsertDiscoveredCandidateAsync(
        Guid batchId,
        ImportedMovieListing listing,
        CancellationToken cancellationToken)
    {
        var candidate = await _dbContext.MovieImportCandidates
            .FirstOrDefaultAsync(
                item =>
                    item.BatchId == batchId &&
                    item.Source == listing.Source &&
                    item.SourceUrl == listing.SourceUrl,
                cancellationToken);

        if (candidate is null)
        {
            candidate = new MovieImportCandidate
            {
                Id = Guid.NewGuid(),
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.MovieImportCandidates.Add(candidate);
        }

        var title = NormalizeOptional(listing.Title) ?? listing.SourceUrl;
        var genreNames = listing.GenreNames
            .Where(genre => !string.IsNullOrWhiteSpace(genre))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        candidate.BatchId = batchId;
        candidate.Source = listing.Source;
        candidate.SourceUrl = listing.SourceUrl;
        candidate.ListingTitle = title;
        candidate.ListingGenres = JoinParts(genreNames);
        candidate.Popularity = listing.Popularity;
        candidate.ReleaseTimestamp = listing.ReleaseTimestamp;
        candidate.Title = title;
        candidate.NormalizedTitle = MovieImportNormalizer.NormalizeTitle(title);
        candidate.Description = string.Empty;
        candidate.DurationMinutes = null;
        candidate.ReleaseDate = null;
        candidate.PosterUrl = null;
        candidate.TrailerUrl = null;
        candidate.GenreName = JoinParts(genreNames);
        candidate.MatchMovieId = null;
        candidate.Status = MovieImportCandidateStatus.Discovered;
        candidate.Warnings = null;
        candidate.DetailError = null;
        candidate.ContentHash = MovieImportNormalizer.Hash(
            listing.Source,
            listing.SourceUrl,
            title,
            JoinParts(genreNames),
            listing.Popularity?.ToString(),
            listing.ReleaseTimestamp?.ToString());
        candidate.UpdatedAt = DateTime.UtcNow;
    }

    private async Task CrawlCandidateCoreAsync(
        MovieImportCandidate candidate,
        IMovieImportProvider provider,
        CancellationToken cancellationToken)
    {
        try
        {
            var importedMovie = await provider.FetchDetailAsync(
                candidate.SourceUrl,
                cancellationToken);

            if (importedMovie is null)
            {
                MarkCandidateFailed(
                    candidate,
                    "Movie detail could not be parsed.");
                return;
            }

            var genreNames = MergeGenreNames(
                importedMovie.GenreNames,
                GetStoredParts(candidate.ListingGenres));
            var matchMovie = await FindMatchAsync(
                importedMovie,
                cancellationToken);
            var warnings = await BuildWarningsAsync(
                importedMovie,
                genreNames,
                cancellationToken);

            candidate.Title = importedMovie.Title.Trim();
            candidate.NormalizedTitle =
                MovieImportNormalizer.NormalizeTitle(importedMovie.Title);
            candidate.Description = importedMovie.Description.Trim();
            candidate.DurationMinutes = importedMovie.DurationMinutes;
            candidate.ReleaseDate = importedMovie.ReleaseDate;
            candidate.PosterUrl = NormalizeOptional(importedMovie.PosterUrl);
            candidate.TrailerUrl = NormalizeOptional(importedMovie.TrailerUrl);
            candidate.GenreName = JoinParts(genreNames);
            candidate.MatchMovieId = matchMovie?.Id;
            candidate.Status = warnings.Count == 0
                ? MovieImportCandidateStatus.Crawled
                : MovieImportCandidateStatus.NeedsReview;
            candidate.Warnings = warnings.Count == 0
                ? null
                : string.Join(" ", warnings);
            candidate.DetailError = null;
            candidate.ContentHash = importedMovie.ContentHash;
            candidate.UpdatedAt = DateTime.UtcNow;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            MarkCandidateFailed(candidate, ex.Message);
        }
    }

    private static void MarkCandidateFailed(
        MovieImportCandidate candidate,
        string error)
    {
        candidate.Status = MovieImportCandidateStatus.Failed;
        candidate.DetailError = error;
        candidate.Warnings = error;
        candidate.UpdatedAt = DateTime.UtcNow;
    }

    private async Task<Movie?> FindMatchAsync(
        ImportedMovieData importedMovie,
        CancellationToken cancellationToken)
    {
        var externalSource = await _dbContext.MovieExternalSources
            .Include(source => source.Movie)
            .FirstOrDefaultAsync(
                source =>
                    source.Source == importedMovie.Source &&
                    source.SourceUrl == importedMovie.SourceUrl,
                cancellationToken);

        if (externalSource?.Movie is not null)
        {
            return externalSource.Movie;
        }

        var normalizedTitle =
            MovieImportNormalizer.NormalizeTitle(importedMovie.Title);
        var movies = await _dbContext.Movies
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return movies.FirstOrDefault(movie =>
            MovieImportNormalizer.NormalizeTitle(movie.Title) == normalizedTitle &&
            importedMovie.ReleaseDate is not null &&
            movie.ReleaseDate.Date == importedMovie.ReleaseDate.Value.Date);
    }

    private async Task<IReadOnlyList<string>> BuildWarningsAsync(
        ImportedMovieData movie,
        IReadOnlyCollection<string> genreNames,
        CancellationToken cancellationToken)
    {
        var warnings = new List<string>();

        if (movie.DurationMinutes is null or <= 0)
        {
            warnings.Add("Duration is missing.");
        }

        if (movie.ReleaseDate is null)
        {
            warnings.Add("Release date is missing.");
        }

        if (string.IsNullOrWhiteSpace(movie.Description))
        {
            warnings.Add("Description is missing.");
        }

        if (string.IsNullOrWhiteSpace(movie.PosterUrl))
        {
            warnings.Add("Poster is missing.");
        }

        if (string.IsNullOrWhiteSpace(movie.TrailerUrl))
        {
            warnings.Add("Trailer is missing.");
        }

        var unknownGenres = await GetUnknownGenresAsync(
            genreNames,
            cancellationToken);

        if (unknownGenres.Count > 0)
        {
            warnings.Add(
                $"Genres need review: {string.Join(", ", unknownGenres)}.");
        }

        return warnings;
    }

    private async Task<IReadOnlyList<Genre>> ResolveGenresAsync(
        IReadOnlyCollection<string> genreNames,
        bool requireAll,
        CancellationToken cancellationToken)
    {
        if (genreNames.Count == 0)
        {
            return [];
        }

        var genres = await _dbContext.Genres
            .AsNoTracking()
            .ToListAsync(cancellationToken);
        var result = new List<Genre>();
        var missing = new List<string>();

        foreach (var genreName in genreNames)
        {
            var slug = MovieImportNormalizer.ToSlug(genreName);
            var genre = genres.FirstOrDefault(item =>
                string.Equals(item.Slug, slug, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(
                    MovieImportNormalizer.ToSlug(item.Name),
                    slug,
                    StringComparison.OrdinalIgnoreCase));

            if (genre is null)
            {
                missing.Add(genreName);
                continue;
            }

            if (result.All(item => item.Id != genre.Id))
            {
                result.Add(genre);
            }
        }

        if (requireAll && missing.Count > 0)
        {
            throw new BusinessRuleException(
                $"Create or map missing genres before approval: {string.Join(", ", missing)}.");
        }

        return result;
    }

    private async Task<IReadOnlyList<string>> GetUnknownGenresAsync(
        IReadOnlyCollection<string> genreNames,
        CancellationToken cancellationToken)
    {
        var resolved = await ResolveGenresAsync(
            genreNames,
            requireAll: false,
            cancellationToken);
        var resolvedSlugs = resolved
            .Select(genre => genre.Slug)
            .Concat(resolved.Select(genre => MovieImportNormalizer.ToSlug(genre.Name)))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return genreNames
            .Where(genreName =>
                !resolvedSlugs.Contains(MovieImportNormalizer.ToSlug(genreName)))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private async Task UpsertExternalSourceAsync(
        Movie movie,
        MovieImportCandidate candidate,
        CancellationToken cancellationToken)
    {
        var source = await _dbContext.MovieExternalSources
            .FirstOrDefaultAsync(
                item =>
                    item.Source == candidate.Source &&
                    item.SourceUrl == candidate.SourceUrl,
                cancellationToken);

        if (source is null)
        {
            source = new MovieExternalSource
            {
                Id = Guid.NewGuid(),
                Source = candidate.Source,
                SourceUrl = candidate.SourceUrl
            };

            _dbContext.MovieExternalSources.Add(source);
        }

        source.MovieId = movie.Id;
        source.ContentHash = candidate.ContentHash;
        source.LastSyncedAt = DateTime.UtcNow;
    }

    private async Task<MovieImportCandidate?> LoadCandidateForUpdateAsync(
        Guid candidateId,
        CancellationToken cancellationToken)
    {
        return await _dbContext.MovieImportCandidates
            .Include(item => item.MatchMovie)
                .ThenInclude(movie => movie!.GenreRef)
            .Include(item => item.MatchMovie)
                .ThenInclude(movie => movie!.MovieGenres)
                    .ThenInclude(movieGenre => movieGenre.Genre)
            .FirstOrDefaultAsync(
                item => item.Id == candidateId,
                cancellationToken);
    }

    private async Task<MovieImportCandidateResponse?> LoadCandidateResponseAsync(
        Guid candidateId,
        CancellationToken cancellationToken)
    {
        var candidate = await _dbContext.MovieImportCandidates
            .AsNoTracking()
            .Include(item => item.MatchMovie)
                .ThenInclude(movie => movie!.GenreRef)
            .Include(item => item.MatchMovie)
                .ThenInclude(movie => movie!.MovieGenres)
                    .ThenInclude(movieGenre => movieGenre.Genre)
            .FirstOrDefaultAsync(
                item => item.Id == candidateId,
                cancellationToken);

        return candidate is null
            ? null
            : ToCandidateResponse(candidate);
    }

    private async Task<MovieResponse?> LoadMovieResponseAsync(
        Guid movieId,
        CancellationToken cancellationToken)
    {
        var movie = await _dbContext.Movies
            .AsNoTracking()
            .Include(item => item.GenreRef)
            .Include(item => item.MovieGenres)
                .ThenInclude(movieGenre => movieGenre.Genre)
            .FirstOrDefaultAsync(
                item => item.Id == movieId,
                cancellationToken);

        return movie is null
            ? null
            : ToMovieResponse(movie);
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

    private static MovieImportCandidateResponse ToCandidateResponse(
        MovieImportCandidate candidate)
    {
        return new MovieImportCandidateResponse
        {
            Id = candidate.Id,
            BatchId = candidate.BatchId,
            Source = candidate.Source,
            SourceUrl = candidate.SourceUrl,
            ListingTitle = candidate.ListingTitle,
            ListingGenres = GetStoredParts(candidate.ListingGenres),
            Popularity = candidate.Popularity,
            ReleaseTimestamp = candidate.ReleaseTimestamp,
            Title = candidate.Title,
            NormalizedTitle = candidate.NormalizedTitle,
            Description = candidate.Description,
            DurationMinutes = candidate.DurationMinutes,
            ReleaseDate = candidate.ReleaseDate,
            PosterUrl = candidate.PosterUrl,
            TrailerUrl = candidate.TrailerUrl,
            GenreName = candidate.GenreName,
            GenreNames = GetStoredParts(candidate.GenreName),
            MatchMovieId = candidate.MatchMovieId,
            MatchMovie = candidate.MatchMovie is null
                ? null
                : ToMovieResponse(candidate.MatchMovie),
            Status = candidate.Status,
            Warnings = candidate.Warnings,
            DetailError = candidate.DetailError,
            CreatedAt = candidate.CreatedAt,
            UpdatedAt = candidate.UpdatedAt
        };
    }

    private static MovieResponse ToMovieResponse(Movie movie)
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

        if (genres.Count == 0 && movie.GenreRef is not null)
        {
            genres.Add(new MovieGenreResponse
            {
                Id = movie.GenreRef.Id,
                Name = movie.GenreRef.Name,
                Slug = movie.GenreRef.Slug
            });
        }

        var primaryGenre = genres.FirstOrDefault();

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
            GenreId = primaryGenre?.Id ?? movie.GenreId,
            Genre = primaryGenre?.Name ?? movie.GenreRef?.Name ?? movie.Genre,
            Genres = genres,
            IsActive = movie.IsActive
        };
    }

    private static IReadOnlyList<string> MergeGenreNames(
        IReadOnlyCollection<string> primary,
        IReadOnlyCollection<string> fallback)
    {
        return primary
            .Concat(fallback)
            .Select(NormalizeOptional)
            .Where(value => value is not null)
            .Select(value => value!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static IReadOnlyList<string> GetStoredParts(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? []
            : value.Split(
                    [',', '/', '|'],
                    StringSplitOptions.TrimEntries |
                    StringSplitOptions.RemoveEmptyEntries)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();
    }

    private static string? JoinParts(IReadOnlyCollection<string> values)
    {
        var normalized = values
            .Select(NormalizeOptional)
            .Where(value => value is not null)
            .Select(value => value!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return normalized.Length == 0
            ? null
            : string.Join(", ", normalized);
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}
