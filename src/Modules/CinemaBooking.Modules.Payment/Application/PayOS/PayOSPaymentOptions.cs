namespace CinemaBooking.Modules.Payment.Application.PayOS;

public sealed class PayOSPaymentOptions
{
    public const string SectionName = "PayOS";

    public string ClientId { get; init; } = string.Empty;

    public string ApiKey { get; init; } = string.Empty;

    public string ChecksumKey { get; init; } = string.Empty;

    public string ReturnUrl { get; init; } = string.Empty;

    public string CancelUrl { get; init; } = string.Empty;

    public int ExpirationMinutes { get; init; } = 15;

    public string? PartnerCode { get; init; }
}
