namespace CinemaBooking.Modules.Catalog.Contracts;

public interface ICatalogModule
{
    Task<bool> MovieExistsAsync(Guid movieId);
}
