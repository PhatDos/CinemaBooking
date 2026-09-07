namespace CinemaBooking.Modules.Catalog.Application.MovieImports;

public sealed class MovieImportOptions
{
    public const string SectionName = "MovieImport";

    public bool Enabled { get; init; }

    public int RunOnDay { get; init; } = 1;

    public int RunAtHour { get; init; } = 3;

    public int RequestDelayMs { get; init; } = 1500;

    public int MaxMovies { get; init; }

    public string UserAgent { get; init; } =
        "CinemaBookingBot/1.0 (+local-dev)";

    public MoveekImportOptions Moveek { get; init; } = new();
}

public sealed class MoveekImportOptions
{
    public string BaseUrl { get; init; } = "https://moveek.com";

    public string[] ListingPaths { get; init; } =
    [
        "/dang-chieu/"
    ];
}
