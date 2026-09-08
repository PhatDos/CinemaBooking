using CinemaBooking.Modules.Booking.Application.Pricing;

namespace CinemaBooking.UnitTests;

public class SeatPricingTests
{
    [Theory]
    [InlineData("Standard", 91000)]
    [InlineData("VIP", 111000)]
    [InlineData("Couple", 211000)]
    [InlineData(null, 91000)]
    public void Calculate_ReturnsShowtimeSeatPricesBySeatType(
        string? seatType,
        decimal expectedPrice)
    {
        var price = SeatPricing.Calculate(
            91000,
            seatType,
            91000,
            111000,
            211000);

        Assert.Equal(expectedPrice, price);
    }

    [Theory]
    [InlineData("Standard", 123000)]
    [InlineData("VIP", 100000)]
    [InlineData("Couple", 200000)]
    [InlineData(null, 123000)]
    public void Calculate_FallsBackToBaseAndDefaultPrices(
        string? seatType,
        decimal expectedPrice)
    {
        var price = SeatPricing.Calculate(
            123000,
            seatType);

        Assert.Equal(expectedPrice, price);
    }
}
