using System.Text.Json;
using System.Text.RegularExpressions;
using AngleSharp.Html.Parser;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CinemaBooking.Modules.Catalog.Application.MovieImports;

public sealed partial class MoveekMovieImportProvider : IMovieImportProvider
{
    public const string ProviderSource = "Moveek";

    private readonly HttpClient _httpClient;
    private readonly MovieImportOptions _options;
    private readonly ILogger<MoveekMovieImportProvider> _logger;
    private readonly HtmlParser _parser = new();

    public MoveekMovieImportProvider(
        HttpClient httpClient,
        IOptions<MovieImportOptions> options,
        ILogger<MoveekMovieImportProvider> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public string Source => ProviderSource;

    public async Task<IReadOnlyList<ImportedMovieData>> FetchAsync(
        CancellationToken cancellationToken = default)
    {
        var urls = await FetchMovieUrlsAsync(cancellationToken);
        var movies = new List<ImportedMovieData>();

        foreach (var url in urls.Take(_options.MaxMovies))
        {
            try
            {
                var html =
                    await _httpClient.GetStringAsync(
                        url,
                        cancellationToken);

                var movie = await ParseMoviePageAsync(
                    html,
                    url,
                    cancellationToken);

                if (movie is not null)
                {
                    movies.Add(movie);
                }

                if (_options.RequestDelayMs > 0)
                {
                    await Task.Delay(
                        _options.RequestDelayMs,
                        cancellationToken);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(
                    ex,
                    "Unable to import Moveek movie page {MovieUrl}.",
                    url);
            }
        }

        return movies;
    }

    public async Task<ImportedMovieData?> ParseMoviePageAsync(
        string html,
        string sourceUrl,
        CancellationToken cancellationToken = default)
    {
        var document =
            await _parser.ParseDocumentAsync(
                html,
                cancellationToken);

        var movieJson =
            document.QuerySelectorAll("script[type='application/ld+json']")
                .Select(script => script.TextContent)
                .Select(FindMovieJson)
                .FirstOrDefault(json => json is not null);

        var title =
            GetString(movieJson, "name") ??
            document.QuerySelector("h1")?.TextContent.Trim() ??
            string.Empty;

        if (string.IsNullOrWhiteSpace(title))
        {
            return null;
        }

        var description =
            GetString(movieJson, "description") ??
            document.QuerySelector("meta[name='description']")
                ?.GetAttribute("content") ??
            string.Empty;

        var duration =
            ParseDuration(GetString(movieJson, "duration"));
        var releaseDate =
            ParseDate(GetString(movieJson, "datePublished"));
        var genre =
            GetGenre(movieJson);
        var posterUrl =
            GetImageUrl(movieJson) ??
            document.QuerySelector("meta[property='og:image']")
                ?.GetAttribute("content");
        var trailerUrl =
            ToYouTubeWatchUrl(
                document.QuerySelector("a[data-video-url]")
                    ?.GetAttribute("data-video-url"));

        return new ImportedMovieData(
            Source,
            sourceUrl,
            title.Trim(),
            description.Trim(),
            duration,
            releaseDate,
            NormalizeOptionalUrl(posterUrl),
            trailerUrl,
            NormalizeOptional(genre),
            MovieImportNormalizer.Hash(
                title,
                description,
                duration?.ToString(),
                releaseDate?.ToString("O"),
                posterUrl,
                trailerUrl,
                genre));
    }

    private async Task<IReadOnlyList<string>> FetchMovieUrlsAsync(
        CancellationToken cancellationToken)
    {
        var urls = new HashSet<string>(
            StringComparer.OrdinalIgnoreCase);

        foreach (var listingPath in _options.Moveek.ListingPaths)
        {
            var listingUrl =
                ToAbsoluteUrl(listingPath);
            var html =
                await _httpClient.GetStringAsync(
                    listingUrl,
                    cancellationToken);
            var document =
                await _parser.ParseDocumentAsync(
                    html,
                    cancellationToken);

            foreach (var href in document
                         .QuerySelectorAll("a[href^='/phim/']")
                         .Select(anchor => anchor.GetAttribute("href"))
                         .Where(href => !string.IsNullOrWhiteSpace(href)))
            {
                urls.Add(ToAbsoluteUrl(href!));
            }

            if (_options.RequestDelayMs > 0)
            {
                await Task.Delay(
                    _options.RequestDelayMs,
                    cancellationToken);
            }
        }

        return urls.ToList();
    }

    private string ToAbsoluteUrl(string pathOrUrl)
    {
        if (Uri.TryCreate(
                pathOrUrl,
                UriKind.Absolute,
                out var absolute))
        {
            return absolute.ToString();
        }

        var baseUri =
            new Uri(_options.Moveek.BaseUrl.TrimEnd('/') + "/");

        return new Uri(baseUri, pathOrUrl.TrimStart('/')).ToString();
    }

    private static JsonElement? FindMovieJson(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(json);

            return FindMovieJson(document.RootElement);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static JsonElement? FindMovieJson(JsonElement element)
    {
        if (IsMovieElement(element))
        {
            return element.Clone();
        }

        if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var child in element.EnumerateArray())
            {
                var match = FindMovieJson(child);

                if (match is not null)
                {
                    return match;
                }
            }
        }

        if (element.ValueKind == JsonValueKind.Object &&
            element.TryGetProperty("@graph", out var graph))
        {
            return FindMovieJson(graph);
        }

        return null;
    }

    private static bool IsMovieElement(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object ||
            !element.TryGetProperty("@type", out var type))
        {
            return false;
        }

        return type.ValueKind switch
        {
            JsonValueKind.String => string.Equals(
                type.GetString(),
                "Movie",
                StringComparison.OrdinalIgnoreCase),
            JsonValueKind.Array => type.EnumerateArray().Any(item =>
                item.ValueKind == JsonValueKind.String &&
                string.Equals(
                    item.GetString(),
                    "Movie",
                    StringComparison.OrdinalIgnoreCase)),
            _ => false
        };
    }

    private static string? GetString(
        JsonElement? element,
        string propertyName)
    {
        if (element is null ||
            !element.Value.TryGetProperty(propertyName, out var property))
        {
            return null;
        }

        return property.ValueKind == JsonValueKind.String
            ? property.GetString()
            : null;
    }

    private static string? GetGenre(JsonElement? element)
    {
        if (element is null ||
            !element.Value.TryGetProperty("genre", out var property))
        {
            return null;
        }

        return property.ValueKind switch
        {
            JsonValueKind.String => property.GetString(),
            JsonValueKind.Array => string.Join(
                ", ",
                property.EnumerateArray()
                    .Where(item => item.ValueKind == JsonValueKind.String)
                    .Select(item => item.GetString())
                    .Where(value => !string.IsNullOrWhiteSpace(value))),
            _ => null
        };
    }

    private static string? GetImageUrl(JsonElement? element)
    {
        if (element is null ||
            !element.Value.TryGetProperty("image", out var property))
        {
            return null;
        }

        if (property.ValueKind == JsonValueKind.String)
        {
            return property.GetString();
        }

        if (property.ValueKind == JsonValueKind.Object)
        {
            return GetString(property, "url");
        }

        return null;
    }

    private static int? ParseDuration(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        try
        {
            var timeSpan = System.Xml.XmlConvert.ToTimeSpan(value);

            return (int)Math.Round(timeSpan.TotalMinutes);
        }
        catch (FormatException)
        {
            return null;
        }
    }

    private static DateTime? ParseDate(string? value)
    {
        return DateTime.TryParse(
            value,
            out var date)
            ? date.Date
            : null;
    }

    private static string? ToYouTubeWatchUrl(string? videoValue)
    {
        var value = NormalizeOptional(videoValue);

        if (value is null)
        {
            return null;
        }

        if (Uri.TryCreate(
                value,
                UriKind.Absolute,
                out var uri))
        {
            if (uri.Host.Equals(
                    "youtu.be",
                    StringComparison.OrdinalIgnoreCase))
            {
                var id = CleanVideoId(uri.AbsolutePath.Trim('/'));

                return id is null
                    ? null
                    : $"https://www.youtube.com/watch?v={id}";
            }

            if (uri.Host.EndsWith(
                    "youtube.com",
                    StringComparison.OrdinalIgnoreCase))
            {
                var watchId = GetQueryValue(uri, "v");

                if (!string.IsNullOrWhiteSpace(watchId))
                {
                    return ToYouTubeWatchUrl(watchId);
                }

                var segments =
                    uri.AbsolutePath.Split(
                        '/',
                        StringSplitOptions.RemoveEmptyEntries);

                if (segments.Length >= 2 &&
                    segments[0] is "embed" or "shorts")
                {
                    return ToYouTubeWatchUrl(segments[1]);
                }
            }
        }

        var videoId = CleanVideoId(value);

        return videoId is null
            ? null
            : $"https://www.youtube.com/watch?v={videoId}";
    }

    private static string? CleanVideoId(string? value)
    {
        var trimmed = value?.Trim();

        if (string.IsNullOrWhiteSpace(trimmed))
        {
            return null;
        }

        return YouTubeIdRegex().IsMatch(trimmed)
            ? trimmed
            : null;
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

    private static string? NormalizeOptionalUrl(string? value)
    {
        var trimmed = NormalizeOptional(value);

        if (trimmed is null)
        {
            return null;
        }

        if (trimmed.StartsWith("//", StringComparison.Ordinal))
        {
            return "https:" + trimmed;
        }

        return trimmed;
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }

    [GeneratedRegex("^[A-Za-z0-9_-]{6,}$")]
    private static partial Regex YouTubeIdRegex();
}
