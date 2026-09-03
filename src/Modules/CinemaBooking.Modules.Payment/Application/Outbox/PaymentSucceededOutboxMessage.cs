namespace CinemaBooking.Modules.Payment.Application.Outbox;

public sealed record PaymentSucceededOutboxMessage(
    Guid PaymentId,
    Guid BookingId,
    Guid UserId);
