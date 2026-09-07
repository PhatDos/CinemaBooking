using CinemaBooking.Modules.Theater.Application;
using CinemaBooking.Modules.Theater.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.UnitTests;

public class TheaterModuleTests
{
    [Fact]
    public async Task Create_Update_Get_preserve_cinema_image_url()
    {
        await using var dbContext = CreateDbContext();
        var module = new TheaterModule(dbContext);

        var created =
            await module.CreateCinemaAsync(
                "Image Cinema",
                "1 Poster Street",
                "Ho Chi Minh City",
                "Cinema with an image",
                "https://cdn.example.com/cinemas/image-cinema.jpg",
                "79",
                "Ho Chi Minh City",
                "26740",
                "Sai Gon Ward",
                "1 Poster Street");

        Assert.Equal(
            "https://cdn.example.com/cinemas/image-cinema.jpg",
            created.ImageUrl);

        var fetched =
            await module.GetCinemaAsync(created.Id);

        Assert.NotNull(fetched);
        Assert.Equal(created.ImageUrl, fetched.ImageUrl);

        await module.UpdateCinemaAsync(
            created.Id,
            "Image Cinema Updated",
            "2 Poster Street",
            "Ho Chi Minh City",
            "Updated cinema",
            "https://cdn.example.com/cinemas/image-cinema-updated.jpg",
            true,
            "79",
            "Ho Chi Minh City",
            "26740",
            "Sai Gon Ward",
            "2 Poster Street");

        var updated =
            await module.GetCinemaAsync(created.Id);

        Assert.NotNull(updated);
        Assert.Equal(
            "https://cdn.example.com/cinemas/image-cinema-updated.jpg",
            updated.ImageUrl);

        await module.UpdateCinemaAsync(
            created.Id,
            "Image Cinema Updated",
            "2 Poster Street",
            "Ho Chi Minh City",
            "Updated cinema",
            null,
            true,
            "79",
            "Ho Chi Minh City",
            "26740",
            "Sai Gon Ward",
            "2 Poster Street");

        var withoutImage =
            await module.GetCinemaAsync(created.Id);

        Assert.NotNull(withoutImage);
        Assert.Null(withoutImage.ImageUrl);
    }

    private static TheaterDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<TheaterDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TheaterDbContext(options);
    }
}
