using System.Globalization;
using System.Text;
using CinemaBooking.Modules.Catalog.Application.Interfaces;
using CinemaBooking.Modules.Catalog.Domain;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.Extensions.Caching.Memory;

namespace CinemaBooking.Modules.Catalog.Application.Genres;

public class GenreService
{
    private const string GenresCacheKey = "catalog:genres:all";
    private const int MaximumNameLength = 100;
    private const int MaximumSlugLength = 120;
    private const int MaximumImageUrlLength = 1000;

    private static readonly TimeSpan CacheDuration =
        TimeSpan.FromMinutes(30);

    private readonly IGenreRepository _genreRepository;
    private readonly IMemoryCache _cache;

    public GenreService(
        IGenreRepository genreRepository,
        IMemoryCache cache)
    {
        _genreRepository = genreRepository;
        _cache = cache;
    }

    public async Task<IReadOnlyList<GenreResponse>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue<IReadOnlyList<GenreResponse>>(
                GenresCacheKey,
                out var cachedGenres) &&
            cachedGenres is not null)
        {
            return cachedGenres;
        }

        var genres =
            (await _genreRepository.GetAllAsync(cancellationToken))
            .Select(ToResponse)
            .ToList();

        _cache.Set(
            GenresCacheKey,
            genres,
            CacheDuration);

        return genres;
    }

    public async Task<GenreResponse> CreateAsync(
        CreateGenreRequest request,
        CancellationToken cancellationToken = default)
    {
        var name = NormalizeRequired(
            request.Name,
            "Genre name is required.",
            MaximumNameLength,
            "Genre name");
        var slug = NormalizeSlug(
            string.IsNullOrWhiteSpace(request.Slug)
                ? name
                : request.Slug);
        var imageUrl = NormalizeRequired(
            request.ImageUrl,
            "Genre image URL is required.",
            MaximumImageUrlLength,
            "Genre image URL");

        ValidateUrl(imageUrl);
        await EnsureSlugIsUniqueAsync(
            slug,
            null,
            cancellationToken);

        var genre = new Genre
        {
            Id = Guid.NewGuid(),
            Name = name,
            Slug = slug,
            ImageUrl = imageUrl,
            CreatedAt = DateTime.UtcNow
        };

        await _genreRepository.AddAsync(
            genre,
            cancellationToken);
        await _genreRepository.SaveChangesAsync(cancellationToken);
        ClearCache();

        return ToResponse(genre);
    }

    public async Task UpdateAsync(
        Guid id,
        UpdateGenreRequest request,
        CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty)
        {
            throw new BusinessRuleException("Genre id is required.");
        }

        var genre =
            await _genreRepository.GetByIdForUpdateAsync(
                id,
                cancellationToken);

        if (genre is null)
        {
            throw new NotFoundException("Genre was not found.");
        }

        var name = NormalizeRequired(
            request.Name,
            "Genre name is required.",
            MaximumNameLength,
            "Genre name");
        var slug = NormalizeSlug(
            string.IsNullOrWhiteSpace(request.Slug)
                ? name
                : request.Slug);
        var imageUrl = NormalizeRequired(
            request.ImageUrl,
            "Genre image URL is required.",
            MaximumImageUrlLength,
            "Genre image URL");

        ValidateUrl(imageUrl);
        await EnsureSlugIsUniqueAsync(
            slug,
            id,
            cancellationToken);

        genre.Name = name;
        genre.Slug = slug;
        genre.ImageUrl = imageUrl;

        await _genreRepository.SaveChangesAsync(cancellationToken);
        ClearCache();
    }

    public async Task DeleteAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty)
        {
            throw new BusinessRuleException("Genre id is required.");
        }

        var genre =
            await _genreRepository.GetByIdForUpdateAsync(
                id,
                cancellationToken);

        if (genre is null)
        {
            throw new NotFoundException("Genre was not found.");
        }

        var isUsed =
            await _genreRepository.IsUsedByMovieAsync(
                id,
                cancellationToken);

        if (isUsed)
        {
            throw new ConflictException(
                "Genre is being used by one or more movies.");
        }

        _genreRepository.Remove(genre);
        await _genreRepository.SaveChangesAsync(cancellationToken);
        ClearCache();
    }

    private async Task EnsureSlugIsUniqueAsync(
        string slug,
        Guid? currentGenreId,
        CancellationToken cancellationToken)
    {
        var existingGenre =
            await _genreRepository.GetBySlugAsync(
                slug,
                cancellationToken);

        if (existingGenre is not null &&
            existingGenre.Id != currentGenreId)
        {
            throw new ConflictException("Genre slug already exists.");
        }
    }

    private void ClearCache()
    {
        _cache.Remove(GenresCacheKey);
    }

    private static GenreResponse ToResponse(Genre genre)
    {
        return new GenreResponse
        {
            Id = genre.Id,
            Name = genre.Name,
            Slug = genre.Slug,
            ImageUrl = genre.ImageUrl,
            CreatedAt = genre.CreatedAt
        };
    }

    private static string NormalizeRequired(
        string? value,
        string requiredMessage,
        int maximumLength,
        string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new BusinessRuleException(requiredMessage);
        }

        var normalized = value.Trim();

        if (normalized.Length > maximumLength)
        {
            throw new BusinessRuleException(
                $"{fieldName} must be {maximumLength} characters or fewer.");
        }

        return normalized;
    }

    private static string NormalizeSlug(string value)
    {
        var normalized = RemoveDiacritics(value)
            .ToLowerInvariant();

        var builder = new StringBuilder();
        var previousWasDash = false;

        foreach (var character in normalized)
        {
            if (char.IsLetterOrDigit(character))
            {
                builder.Append(character);
                previousWasDash = false;
                continue;
            }

            if (!previousWasDash)
            {
                builder.Append('-');
                previousWasDash = true;
            }
        }

        var slug = builder
            .ToString()
            .Trim('-');

        if (string.IsNullOrWhiteSpace(slug))
        {
            throw new BusinessRuleException("Genre slug is required.");
        }

        if (slug.Length > MaximumSlugLength)
        {
            throw new BusinessRuleException(
                $"Genre slug must be {MaximumSlugLength} characters or fewer.");
        }

        return slug;
    }

    private static string RemoveDiacritics(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder();

        foreach (var character in normalized)
        {
            var unicodeCategory =
                CharUnicodeInfo.GetUnicodeCategory(character);

            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }

        return builder
            .ToString()
            .Normalize(NormalizationForm.FormC);
    }

    private static void ValidateUrl(string imageUrl)
    {
        if (!Uri.TryCreate(
                imageUrl,
                UriKind.Absolute,
                out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp &&
             uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new BusinessRuleException(
                "Genre image URL must be a valid HTTP or HTTPS URL.");
        }
    }
}
