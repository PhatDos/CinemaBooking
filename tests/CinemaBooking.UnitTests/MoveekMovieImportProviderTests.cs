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
        Assert.Equal("Comedy, Drama, Family", movie.GenreName);
        Assert.Equal("https://cdn.moveek.com/poster.webp", movie.PosterUrl);
        Assert.Equal(
            "https://www.youtube.com/watch?v=ET8Jilh95Gw",
            movie.TrailerUrl);
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

    private static MoveekMovieImportProvider CreateProvider()
    {
        return new MoveekMovieImportProvider(
            new HttpClient(),
            Options.Create(new MovieImportOptions()),
            NullLogger<MoveekMovieImportProvider>.Instance);
    }
}
