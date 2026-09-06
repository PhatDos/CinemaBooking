using CinemaBooking.Modules.Catalog.Application.MovieImports;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;

namespace CinemaBooking.Api.Media;

public sealed class CloudinaryMoviePosterImporter : IMoviePosterImporter
{
    private const string MoviePosterFolder = "cinema-booking/movies/imports";

    private readonly CloudinaryOptions _options;

    public CloudinaryMoviePosterImporter(
        IOptions<CloudinaryOptions> options)
    {
        _options = options.Value;
    }

    public async Task<ImportedPosterResult?> ImportAsync(
        string posterUrl,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(posterUrl))
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(_options.CloudName) ||
            string.IsNullOrWhiteSpace(_options.ApiKey) ||
            string.IsNullOrWhiteSpace(_options.ApiSecret))
        {
            return new ImportedPosterResult(
                posterUrl,
                null);
        }

        var cloudinary = new Cloudinary(new Account(
            _options.CloudName,
            _options.ApiKey,
            _options.ApiSecret));

        var uploadResult =
            await cloudinary.UploadAsync(new ImageUploadParams
            {
                File = new FileDescription(posterUrl),
                Folder = MoviePosterFolder,
                UseFilename = true,
                UniqueFilename = true,
                Overwrite = false
            });

        cancellationToken.ThrowIfCancellationRequested();

        var statusCode = (int)uploadResult.StatusCode;

        if (statusCode is < 200 or >= 300 ||
            uploadResult.SecureUrl is null)
        {
            throw new InvalidOperationException(
                uploadResult.Error?.Message ??
                "Cloudinary poster import failed.");
        }

        return new ImportedPosterResult(
            uploadResult.SecureUrl.ToString(),
            uploadResult.PublicId);
    }
}
