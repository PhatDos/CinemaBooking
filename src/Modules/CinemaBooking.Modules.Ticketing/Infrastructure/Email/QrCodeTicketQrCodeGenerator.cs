using CinemaBooking.Modules.Ticketing.Application.Email;
using QRCoder;

namespace CinemaBooking.Modules.Ticketing.Infrastructure.Email;

public sealed class QrCodeTicketQrCodeGenerator :
    ITicketQrCodeGenerator
{
    public byte[] GeneratePng(string ticketCode)
    {
        var payload = TicketQrPayload.Create(ticketCode);

        using var qrGenerator = new QRCodeGenerator();
        using var qrData =
            qrGenerator.CreateQrCode(
                payload,
                QRCodeGenerator.ECCLevel.Q);

        var qrCode = new PngByteQRCode(qrData);

        return qrCode.GetGraphic(10);
    }
}
