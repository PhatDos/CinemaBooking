namespace CinemaBooking.Modules.Ticketing.Application.Email;

public sealed record EmailMessage(
    string To,
    string Subject,
    string HtmlBody,
    IReadOnlyCollection<EmailInlineAttachment>? InlineAttachments = null);

public sealed record EmailInlineAttachment(
    string ContentId,
    string ContentType,
    byte[] Bytes);
