namespace CinemaBooking.Modules.Booking.Application.Pricing;

public static class SeatPricing
{
    private const decimal VipSurcharge = 30000m;
    private const decimal CoupleSurcharge = 90000m;

    public static decimal Calculate(decimal basePrice, string? seatType)
    {
        return basePrice + GetSurcharge(seatType);
    }

    public static decimal GetSurcharge(string? seatType)
    {
        return seatType?.Trim().ToUpperInvariant() switch
        {
            "VIP" => VipSurcharge,
            "COUPLE" => CoupleSurcharge,
            _ => 0m
        };
    }
}
