namespace CinemaBooking.Modules.Payment.Application.PayOS;

public sealed record PaymentLinkResult(
    long OrderCode,
    long Amount,
    string? PaymentLinkId,
    string? Status,
    string? CheckoutUrl,
    string? QrCode);
