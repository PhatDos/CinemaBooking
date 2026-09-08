using CinemaBooking.Api.Infrastructure.Caching;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace CinemaBooking.UnitTests;

public class AppCacheKeysTests
{
    [Theory]
    [InlineData(null, "all")]
    [InlineData("", "all")]
    [InlineData("   ", "all")]
    [InlineData("dn", "DN")]
    [InlineData(" Dn ", "DN")]
    [InlineData("79", "79")]
    public void NormalizeCode_maps_equivalent_query_values_to_one_variant(
        string? value,
        string expected)
    {
        Assert.Equal(
            expected,
            AppCacheKeys.NormalizeCode(value));
    }

    [Fact]
    public void CinemaList_normalizes_filter_values_before_building_key()
    {
        var keys = new AppCacheKeys(
            new FakeHostEnvironment("Development"));

        var first = keys.CinemaList(null, "dn");
        var second = keys.CinemaList(" ", " DN ");

        Assert.Equal(
            "cinema-booking:development:v1:theater:cinemas:list:province:all:ward:DN",
            first);
        Assert.Equal(first, second);
    }

    [Fact]
    public void Keys_and_tags_are_prefixed_by_environment()
    {
        var keys = new AppCacheKeys(
            new FakeHostEnvironment("Production"));
        var cinemaId =
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        Assert.Equal(
            "cinema-booking:production:v1:catalog:movies:list:public",
            keys.MoviesPublicList);
        Assert.Equal(
            "cinema-booking:production:v1:catalog:movies:now-showing",
            keys.NowShowing);
        Assert.Equal(
            "cinema-booking:production:v1:theater:cinemas:detail:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            keys.CinemaDetail(cinemaId));
        Assert.Equal(
            "cinema-booking:production:cache-tag:catalog:movies",
            keys.Tag(AppCacheTags.CatalogMovies));
    }

    private sealed class FakeHostEnvironment : IHostEnvironment
    {
        public FakeHostEnvironment(string environmentName)
        {
            EnvironmentName = environmentName;
        }

        public string EnvironmentName { get; set; }

        public string ApplicationName { get; set; } =
            "CinemaBooking.UnitTests";

        public string ContentRootPath { get; set; } = string.Empty;

        public IFileProvider ContentRootFileProvider { get; set; } =
            new NullFileProvider();
    }
}
