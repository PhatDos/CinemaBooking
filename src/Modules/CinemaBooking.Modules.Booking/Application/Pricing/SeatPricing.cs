namespace CinemaBooking.Modules.Booking.Application.Pricing;

public static class SeatPricing
{
    private const decimal StandardPrice = 90000m;
    private const decimal VipPrice = 100000m;
    private const decimal CouplePrice = 190000m;

    public static decimal Calculate(decimal basePrice, string? seatType)
    {
        return GetPrice(seatType);
    }

    public static decimal GetPrice(string? seatType)
    {
        return seatType?.Trim().ToUpperInvariant() switch
        {
            "VIP" => VipPrice,
            "COUPLE" => CouplePrice,
            _ => StandardPrice
        };
    }
}
