using CinemaBooking.Modules.Catalog.Application.MovieImports;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace CinemaBooking.UnitTests;

public class MoveekMovieImportProviderTests
{
    [Fact]
    public async Task ParseMoviePageAsync_reads_json_ld_and_data_video_url()
    {
        var provider = CreateProvider();
        const string html = """
            <html>
              <head>
                <meta property="og:image" content="https://cdn.moveek.com/fallback.webp" />
                <script type="application/ld+json">
                  {
                    "@context": "http://schema.org",
                    "@type": "Movie",
                    "name": "Nghi He So Nghi Huu",
                    "description": "A family comedy.",
                    "duration": "PT117M",
                    "datePublished": "2026-08-21T00:00:00+07:00",
                    "genre": "Comedy, Drama, Family",
                    "image": {
                      "@type": "ImageObject",
                      "url": "https://cdn.moveek.com/poster.webp"
                    }
                  }
                </script>
              </head>
              <body>
                <a href="/video/19004/" data-video-url="ET8Jilh95Gw">Trailer</a>
              </body>
            </html>
            """;

        var movie =
            await provider.ParseMoviePageAsync(
                html,
                "https://moveek.com/phim/nghi-he-so-nghi-huu/");

        Assert.NotNull(movie);
        Assert.Equal("Nghi He So Nghi Huu", movie.Title);
        Assert.Equal("A family comedy.", movie.Description);
        Assert.Equal(117, movie.DurationMinutes);
        Assert.Equal(new DateTime(2026, 8, 21), movie.ReleaseDate);
        Assert.Equal(
            ["Comedy", "Drama", "Family"],
            movie.GenreNames);
        Assert.Equal("https://cdn.moveek.com/poster.webp", movie.PosterUrl);
        Assert.Equal(
            "https://www.youtube.com/watch?v=ET8Jilh95Gw",
            movie.TrailerUrl);
    }

    [Fact]
    public async Task DiscoverAsync_reads_moveek_listing_cards()
    {
        const string listingHtml = """
            <html>
              <body>
                <div class="item language-vietnamese genre-comedy genre-drama genre-family"
                     data-popularity="2465.0358"
                     data-release="1787245200">
                  <a href="/phim/nghi-he-so-nghi-huu/" title="Nghi He So Nghi Huu">Movie</a>
                </div>
                <div class="item language-vietnamese genre-action"
                     data-popularity="1122.9"
                     data-release="1787850000">
                  <a href="/phim/quy-tu-vuot-giau/" title="Quy Tu Vuot Giau">Movie</a>
                </div>
                <a href="/phim/nghi-he-so-nghi-huu/">Duplicate</a>
              </body>
            </html>
            """;
        var provider = CreateProvider(
            new Dictionary<string, string>
            {
                ["https://moveek.com/dang-chieu/"] = listingHtml
            });

        var listings = await provider.DiscoverAsync();

        Assert.Equal(2, listings.Count);
        var first = listings.First(item =>
            item.SourceUrl == "https://moveek.com/phim/nghi-he-so-nghi-huu/");
        Assert.Equal("Nghi He So Nghi Huu", first.Title);
        Assert.Equal(
            ["Comedy", "Drama", "Family"],
            first.GenreNames);
        Assert.Equal(2465.0358m, first.Popularity);
        Assert.Equal(1787245200, first.ReleaseTimestamp);
    }

    [Fact]
    public async Task ParseMoviePageAsync_allows_missing_trailer()
    {
        var provider = CreateProvider();
        const string html = """
            <html>
              <head>
                <script type="application/ld+json">
                  {
                    "@type": "Movie",
                    "name": "No Trailer Movie",
                    "description": "Quiet metadata.",
                    "duration": "PT90M",
                    "datePublished": "2026-09-01"
                  }
                </script>
              </head>
            </html>
            """;

        var movie =
            await provider.ParseMoviePageAsync(
                html,
                "https://moveek.com/phim/no-trailer-movie/");

        Assert.NotNull(movie);
        Assert.Equal("No Trailer Movie", movie.Title);
        Assert.Null(movie.TrailerUrl);
    }

    private static MoveekMovieImportProvider CreateProvider(
        IReadOnlyDictionary<string, string>? responses = null)
    {
        var httpClient = responses is null
            ? new HttpClient()
            : new HttpClient(new StaticResponseHandler(responses));

        return new MoveekMovieImportProvider(
            httpClient,
            Options.Create(new MovieImportOptions
            {
                RequestDelayMs = 0
            }),
            NullLogger<MoveekMovieImportProvider>.Instance);
    }

    private sealed class StaticResponseHandler : HttpMessageHandler
    {
        private readonly IReadOnlyDictionary<string, string> _responses;

        public StaticResponseHandler(
            IReadOnlyDictionary<string, string> responses)
        {
            _responses = responses;
        }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            var uri = request.RequestUri?.ToString() ?? string.Empty;

            if (!_responses.TryGetValue(uri, out var html))
            {
                return Task.FromResult(
                    new HttpResponseMessage(System.Net.HttpStatusCode.NotFound));
            }

            return Task.FromResult(
                new HttpResponseMessage(System.Net.HttpStatusCode.OK)
                {
                    Content = new StringContent(html)
                });
        }
    }
}
