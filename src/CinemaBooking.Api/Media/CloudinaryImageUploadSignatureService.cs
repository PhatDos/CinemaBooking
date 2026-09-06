using CloudinaryDotNet;
using Microsoft.Extensions.Options;

namespace CinemaBooking.Api.Media;

public sealed class CloudinaryImageUploadSignatureService : IImageUploadSignatureService
{
    private const string MoviePosterFolder = "cinema-booking/movies";

    private readonly CloudinaryOptions _options;
    private readonly Cloudinary _cloudinary;

    public CloudinaryImageUploadSignatureService(
        IOptions<CloudinaryOptions> options)
    {
        _options = options.Value;

        if (string.IsNullOrWhiteSpace(_options.CloudName) ||
            string.IsNullOrWhiteSpace(_options.ApiKey) ||
            string.IsNullOrWhiteSpace(_options.ApiSecret))
        {
            throw new InvalidOperationException(
                "Cloudinary configuration is missing.");
        }

        _cloudinary = new Cloudinary(new Account(
            _options.CloudName,
            _options.ApiKey,
            _options.ApiSecret));
    }

    public ImageUploadSignatureResponse CreateMoviePosterSignature()
    {
        var timestamp =
            DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        var parameters =
            new SortedDictionary<string, object>
            {
                ["folder"] = MoviePosterFolder,
                ["timestamp"] = timestamp
            };

        var signature =
            _cloudinary.Api.SignParameters(parameters);

        return new ImageUploadSignatureResponse(
            _options.CloudName,
            _options.ApiKey,
            timestamp,
            signature,
            MoviePosterFolder,
            $"https://api.cloudinary.com/v1_1/{_options.CloudName}/image/upload");
    }
}
