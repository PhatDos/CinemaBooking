using CinemaBooking.Modules.Ticketing.Application.Email;
using CinemaBooking.Modules.Ticketing.Infrastructure.Email;

namespace CinemaBooking.UnitTests;

public class TicketQrPayloadTests
{
    [Fact]
    public void Create_returns_ticket_prefixed_payload()
    {
        var payload = TicketQrPayload.Create("TKT_ABC123");

        Assert.Equal("ticket:TKT_ABC123", payload);
    }

    [Fact]
    public void GeneratePng_returns_png_bytes_for_ticket_payload()
    {
        var generator = new QrCodeTicketQrCodeGenerator();

        var bytes = generator.GeneratePng("TKT_ABC123");

        Assert.True(bytes.Length > 0);
        Assert.Equal(0x89, bytes[0]);
        Assert.Equal(0x50, bytes[1]);
        Assert.Equal(0x4E, bytes[2]);
        Assert.Equal(0x47, bytes[3]);
    }
}
