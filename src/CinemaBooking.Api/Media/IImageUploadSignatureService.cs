namespace CinemaBooking.Api.Media;

public interface IImageUploadSignatureService
{
    ImageUploadSignatureResponse CreateMoviePosterSignature();

    ImageUploadSignatureResponse CreateCinemaImageSignature();
}
