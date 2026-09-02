namespace CinemaBooking.Modules.Payment.Application.PayOS;

public sealed record PaymentLinkRequest(
    long OrderCode,
    decimal Amount,
    string Description,
    string ReturnUrl,
    string CancelUrl);
