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

    public async Task<MovieImportBatchResponse> RunAsync(
        MovieImportRunRequest request,
        CancellationToken cancellationToken = default)
    {
        var source = string.IsNullOrWhiteSpace(request.Source)
            ? MoveekSource
            : request.Source.Trim();
        var provider =
            _providers.FirstOrDefault(item =>
                string.Equals(
                    item.Source,
                    source,
                    StringComparison.OrdinalIgnoreCase));

        if (provider is null)
        {
            throw new BusinessRuleException(
                $"Movie import source '{source}' is not supported.");
        }

        var batch = new MovieImportBatch
        {
            Id = Guid.NewGuid(),
            Source = provider.Source,
            StartedAt = DateTime.UtcNow,
            Status = MovieImportBatchStatus.Running
        };

        _dbContext.MovieImportBatches.Add(batch);
        await _dbContext.SaveChangesAsync(cancellationToken);

        try
        {
            var movies =
                await provider.FetchAsync(cancellationToken);

            foreach (var importedMovie in movies)
            {
                await UpsertCandidateAsync(
                    batch.Id,
                    importedMovie,
                    cancellationToken);
            }

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

        return await GetBatchAsync(
            batch.Id,
            cancellationToken)
            ?? throw new NotFoundException("Movie import batch was not found.");
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
        var exists =
            await _dbContext.MovieImportBatches
                .AnyAsync(
                    batch => batch.Id == batchId,
                    cancellationToken);

        if (!exists)
        {
            throw new NotFoundException("Movie import batch was not found.");
        }

        return await _dbContext.MovieImportCandidates
            .AsNoTracking()
            .Include(candidate => candidate.MatchMovie)
                .ThenInclude(movie => movie!.GenreRef)
            .Where(candidate => candidate.BatchId == batchId)
            .OrderBy(candidate => candidate.Title)
            .Select(candidate => ToCandidateResponse(candidate))
            .ToListAsync(cancellationToken);
    }

    public async Task<MovieResponse> ApproveAsync(
        Guid candidateId,
        CancellationToken cancellationToken = default)
    {
        var candidate =
            await _dbContext.MovieImportCandidates
                .Include(item => item.MatchMovie)
                    .ThenInclude(movie => movie!.GenreRef)
                .FirstOrDefaultAsync(
                    item => item.Id == candidateId,
                    cancellationToken);

        if (candidate is null)
        {
            throw new NotFoundException("Movie import candidate was not found.");
        }

        if (candidate.Status == MovieImportCandidateStatus.Rejected)
        {
            throw new ConflictException("Rejected import candidate cannot be approved.");
        }

        var genre =
            await ResolveGenreAsync(
                candidate.GenreName,
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

        var poster =
            !string.IsNullOrWhiteSpace(candidate.PosterUrl)
                ? await _posterImporter.ImportAsync(
                    candidate.PosterUrl,
                    cancellationToken)
                : null;

        var movie =
            candidate.MatchMovieId is not null
                ? await _dbContext.Movies
                    .Include(item => item.GenreRef)
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

        movie.Title = candidate.Title.Trim();
        movie.Description = candidate.Description.Trim();
        movie.DurationMinutes = candidate.DurationMinutes.Value;
        movie.ReleaseDate = candidate.ReleaseDate.Value;
        movie.TrailerUrl = NormalizeOptional(candidate.TrailerUrl);
        movie.PosterUrl = poster?.PosterUrl ?? NormalizeOptional(candidate.PosterUrl);
        movie.PosterPublicId = poster?.PosterPublicId;
        movie.GenreId = genre?.Id;
        movie.Genre = genre?.Name;
        movie.IsActive = true;

        await UpsertExternalSourceAsync(
            movie,
            candidate,
            cancellationToken);

        candidate.MatchMovieId = movie.Id;
        candidate.Status = MovieImportCandidateStatus.Approved;
        candidate.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToMovieResponse(movie);
    }

    public async Task RejectAsync(
        Guid candidateId,
        CancellationToken cancellationToken = default)
    {
        var candidate =
            await _dbContext.MovieImportCandidates
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

    private async Task UpsertCandidateAsync(
        Guid batchId,
        ImportedMovieData movie,
        CancellationToken cancellationToken)
    {
        var candidate =
            await _dbContext.MovieImportCandidates
                .FirstOrDefaultAsync(
                    item =>
                        item.Source == movie.Source &&
                        item.SourceUrl == movie.SourceUrl &&
                        item.Status != MovieImportCandidateStatus.Approved &&
                        item.Status != MovieImportCandidateStatus.Rejected,
                    cancellationToken);

        var matchMovie =
            await FindMatchAsync(
                movie,
                cancellationToken);
        var warnings = await BuildWarningsAsync(
            movie,
            cancellationToken);
        var status = warnings.Count > 0
            ? MovieImportCandidateStatus.NeedsReview
            : matchMovie is null
                ? MovieImportCandidateStatus.NewSuggested
                : MovieImportCandidateStatus.UpdateSuggested;

        if (candidate is null)
        {
            candidate = new MovieImportCandidate
            {
                Id = Guid.NewGuid(),
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.MovieImportCandidates.Add(candidate);
        }

        candidate.BatchId = batchId;
        candidate.Source = movie.Source;
        candidate.SourceUrl = movie.SourceUrl;
        candidate.Title = movie.Title.Trim();
        candidate.NormalizedTitle =
            MovieImportNormalizer.NormalizeTitle(movie.Title);
        candidate.Description = movie.Description.Trim();
        candidate.DurationMinutes = movie.DurationMinutes;
        candidate.ReleaseDate = movie.ReleaseDate;
        candidate.PosterUrl = NormalizeOptional(movie.PosterUrl);
        candidate.TrailerUrl = NormalizeOptional(movie.TrailerUrl);
        candidate.GenreName = NormalizeOptional(movie.GenreName);
        candidate.MatchMovieId = matchMovie?.Id;
        candidate.Status = status;
        candidate.Warnings = warnings.Count == 0
            ? null
            : string.Join(" ", warnings);
        candidate.ContentHash = movie.ContentHash;
        candidate.UpdatedAt = DateTime.UtcNow;
    }

    private async Task<Movie?> FindMatchAsync(
        ImportedMovieData importedMovie,
        CancellationToken cancellationToken)
    {
        var externalSource =
            await _dbContext.MovieExternalSources
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
        var movies =
            await _dbContext.Movies
                .Include(movie => movie.GenreRef)
                .ToListAsync(cancellationToken);

        return movies.FirstOrDefault(movie =>
            MovieImportNormalizer.NormalizeTitle(movie.Title) == normalizedTitle &&
            importedMovie.ReleaseDate is not null &&
            movie.ReleaseDate.Date == importedMovie.ReleaseDate.Value.Date);
    }

    private async Task<IReadOnlyList<string>> BuildWarningsAsync(
        ImportedMovieData movie,
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

        if (!string.IsNullOrWhiteSpace(movie.GenreName) &&
            await ResolveGenreAsync(
                movie.GenreName,
                cancellationToken) is null)
        {
            warnings.Add("Genre needs review.");
        }

        return warnings;
    }

    private async Task<Genre?> ResolveGenreAsync(
        string? importedGenre,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(importedGenre))
        {
            return null;
        }

        var importedParts =
            importedGenre.Split(
                    [',', '/', '|'],
                    StringSplitOptions.TrimEntries |
                    StringSplitOptions.RemoveEmptyEntries)
                .Select(MovieImportNormalizer.ToSlug)
                .Where(slug => !string.IsNullOrWhiteSpace(slug))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var genres =
            await _dbContext.Genres
                .AsNoTracking()
                .ToListAsync(cancellationToken);

        return genres.FirstOrDefault(genre =>
            importedParts.Contains(genre.Slug) ||
            importedParts.Contains(
                MovieImportNormalizer.ToSlug(genre.Name)));
    }

    private async Task UpsertExternalSourceAsync(
        Movie movie,
        MovieImportCandidate candidate,
        CancellationToken cancellationToken)
    {
        var source =
            await _dbContext.MovieExternalSources
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

    private static MovieImportCandidateResponse ToCandidateResponse(
        MovieImportCandidate candidate)
    {
        return new MovieImportCandidateResponse
        {
            Id = candidate.Id,
            BatchId = candidate.BatchId,
            Source = candidate.Source,
            SourceUrl = candidate.SourceUrl,
            Title = candidate.Title,
            NormalizedTitle = candidate.NormalizedTitle,
            Description = candidate.Description,
            DurationMinutes = candidate.DurationMinutes,
            ReleaseDate = candidate.ReleaseDate,
            PosterUrl = candidate.PosterUrl,
            TrailerUrl = candidate.TrailerUrl,
            GenreName = candidate.GenreName,
            MatchMovieId = candidate.MatchMovieId,
            MatchMovie = candidate.MatchMovie is null
                ? null
                : ToMovieResponse(candidate.MatchMovie),
            Status = candidate.Status,
            Warnings = candidate.Warnings,
            CreatedAt = candidate.CreatedAt,
            UpdatedAt = candidate.UpdatedAt
        };
    }

    private static MovieResponse ToMovieResponse(Movie movie)
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
            GenreId = movie.GenreId,
            Genre = movie.GenreRef?.Name ?? movie.Genre,
            IsActive = movie.IsActive
        };
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}
