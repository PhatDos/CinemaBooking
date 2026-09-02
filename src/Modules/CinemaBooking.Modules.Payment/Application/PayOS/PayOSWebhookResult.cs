namespace CinemaBooking.Modules.Payment.Application.PayOS;

public sealed record PayOSWebhookResult(
    long OrderCode,
    decimal Amount,
    string? Code,
    string? Description,
    string? Reference,
    string? PaymentLinkId);
