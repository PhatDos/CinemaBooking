namespace CinemaBooking.Modules.Payment.Application.PayOS;

public sealed record PaymentLinkStatusResult(
    long OrderCode,
    long Amount,
    string? Status,
    string? PaymentLinkId);
