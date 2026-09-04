using CinemaBooking.Modules.Ticketing.Application;
using CinemaBooking.Modules.Ticketing.Contracts;
using CinemaBooking.Modules.Ticketing.Domain;
using CinemaBooking.Modules.Ticketing.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.UnitTests;

public class TicketingModuleTests
{
    [Fact]
    public async Task IssueTicketsAsync_queues_one_email_job_when_retried()
    {
        var options =
            new DbContextOptionsBuilder<TicketingDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

        await using var dbContext = new TicketingDbContext(options);
        var module = new TicketingModule(dbContext);

        var request =
            new IssueTicketsRequest(
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.NewGuid(),
                [
                    new IssueTicketSeat(Guid.NewGuid()),
                    new IssueTicketSeat(Guid.NewGuid()),
                    new IssueTicketSeat(Guid.NewGuid())
                ]);

        var firstResult =
            await module.IssueTicketsAsync(request);

        var secondResult =
            await module.IssueTicketsAsync(request);

        Assert.Equal(3, firstResult.Count);
        Assert.Equal(3, secondResult.Count);
        Assert.Equal(
            3,
            await dbContext.Tickets.CountAsync());

        var emailJob =
            await dbContext.TicketEmailOutbox.SingleAsync();

        Assert.Equal(request.BookingId, emailJob.BookingId);
        Assert.Equal(request.UserId, emailJob.UserId);
        Assert.Equal(TicketEmailStatus.Pending, emailJob.Status);
    }
}
