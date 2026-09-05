using CinemaBooking.Modules.Booking.Application.Pricing;

namespace CinemaBooking.UnitTests;

public class SeatPricingTests
{
    [Theory]
    [InlineData("Standard", 90000)]
    [InlineData("VIP", 100000)]
    [InlineData("Couple", 200000)]
    [InlineData(null, 90000)]
    public void Calculate_ReturnsFixedSeedPricesBySeatType(
        string? seatType,
        decimal expectedPrice)
    {
        var price = SeatPricing.Calculate(
            250000,
            seatType);

        Assert.Equal(expectedPrice, price);
    }
}
