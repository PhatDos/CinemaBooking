namespace CinemaBooking.Modules.Ticketing.Application.Email;

public interface ITicketQrCodeGenerator
{
    byte[] GeneratePng(string ticketCode);
}
