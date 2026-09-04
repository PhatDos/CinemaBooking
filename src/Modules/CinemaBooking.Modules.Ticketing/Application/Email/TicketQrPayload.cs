namespace CinemaBooking.Modules.Ticketing.Application.Email;

public static class TicketQrPayload
{
    public static string Create(string ticketCode)
    {
        return $"ticket:{ticketCode}";
    }
}
