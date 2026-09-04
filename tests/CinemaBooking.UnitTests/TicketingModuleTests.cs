using CinemaBooking.Modules.Ticketing.Application;
using CinemaBooking.Modules.Ticketing.Contracts;
using CinemaBooking.Modules.Ticketing.Domain;
using CinemaBooking.Modules.Ticketing.Infrastructure.Persistence;
using CinemaBooking.SharedKernel.Exceptions;
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

    [Fact]
    public async Task CheckInAsync_accepts_qr_payload_and_marks_ticket_used()
    {
        var options = CreateOptions();

        await using var dbContext = new TicketingDbContext(options);
        var module = new TicketingModule(dbContext);

        var ticket = CreateTicket();
        dbContext.Tickets.Add(ticket);
        await dbContext.SaveChangesAsync();

        var result =
            await module.CheckInAsync($"ticket:{ticket.Code}");

        Assert.Equal(ticket.Id, result.TicketId);
        Assert.Equal("Used", result.Status);
        Assert.NotEqual(default, result.UsedAt);

        var savedTicket =
            await dbContext.Tickets.SingleAsync(
                entity => entity.Id == ticket.Id);

        Assert.Equal(TicketStatus.Used, savedTicket.Status);
        Assert.NotNull(savedTicket.UsedAt);
    }

    [Fact]
    public async Task CheckInAsync_rejects_ticket_that_was_already_used()
    {
        var options = CreateOptions();

        await using var dbContext = new TicketingDbContext(options);
        var module = new TicketingModule(dbContext);

        var ticket = CreateTicket(status: TicketStatus.Used);
        ticket.UsedAt = DateTime.UtcNow;
        dbContext.Tickets.Add(ticket);
        await dbContext.SaveChangesAsync();

        await Assert.ThrowsAsync<ConflictException>(
            () => module.CheckInAsync(ticket.Code));
    }

    [Fact]
    public async Task CheckInAsync_rejects_cancelled_ticket()
    {
        var options = CreateOptions();

        await using var dbContext = new TicketingDbContext(options);
        var module = new TicketingModule(dbContext);

        var ticket = CreateTicket(status: TicketStatus.Cancelled);
        dbContext.Tickets.Add(ticket);
        await dbContext.SaveChangesAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(
            () => module.CheckInAsync(ticket.Code));
    }

    [Fact]
    public async Task GetByCodeAsync_accepts_qr_payload()
    {
        var options = CreateOptions();

        await using var dbContext = new TicketingDbContext(options);
        var module = new TicketingModule(dbContext);

        var ticket = CreateTicket();
        dbContext.Tickets.Add(ticket);
        await dbContext.SaveChangesAsync();

        var result =
            await module.GetByCodeAsync($"ticket:{ticket.Code}");

        Assert.NotNull(result);
        Assert.Equal(ticket.Id, result.TicketId);
        Assert.Equal(ticket.BookingId, result.BookingId);
        Assert.Equal(ticket.ShowtimeId, result.ShowtimeId);
        Assert.Equal(ticket.SeatId, result.SeatId);
        Assert.Equal("Valid", result.Status);
    }

    private static DbContextOptions<TicketingDbContext> CreateOptions()
    {
        return new DbContextOptionsBuilder<TicketingDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
    }

    private static Ticket CreateTicket(
        TicketStatus status = TicketStatus.Valid)
    {
        return new Ticket
        {
            Id = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            ShowtimeId = Guid.NewGuid(),
            SeatId = Guid.NewGuid(),
            Code = $"TKT_{Guid.NewGuid():N}",
            Status = status,
            CreatedAt = DateTime.UtcNow
        };
    }
}
