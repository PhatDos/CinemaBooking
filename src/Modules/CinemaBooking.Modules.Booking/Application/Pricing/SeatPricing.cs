namespace CinemaBooking.Modules.Booking.Application.Pricing;

public static class SeatPricing
{
    private const decimal StandardPrice = 90000m;
    private const decimal VipPrice = 100000m;
    private const decimal CouplePrice = 200000m;

    public static decimal Calculate(
        decimal basePrice,
        string? seatType,
        decimal? standardPrice = null,
        decimal? vipPrice = null,
        decimal? couplePrice = null)
    {
        return seatType?.Trim().ToUpperInvariant() switch
        {
            "VIP" => vipPrice ?? VipPrice,
            "COUPLE" => couplePrice ?? CouplePrice,
            _ => standardPrice ?? (basePrice > 0 ? basePrice : StandardPrice)
        };
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
