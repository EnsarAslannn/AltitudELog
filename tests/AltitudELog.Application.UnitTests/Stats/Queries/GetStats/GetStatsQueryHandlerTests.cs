using AltitudELog.Application.Stats.Queries.GetStats;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.UnitTests.Stats.Queries.GetStats;

public class GetStatsQueryHandlerTests
{
    private static TestApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestApplicationDbContext(options);
    }

    private static Pilot NewPilot(PilotRank rank) => new()
    {
        Id = Guid.NewGuid(),
        Name = "Test Pilot",
        LicenseNumber = $"LIC-{Guid.NewGuid():N}",
        Rank = rank,
        Username = $"pilot_{Guid.NewGuid():N}",
        PasswordHash = "hash"
    };

    private static Flight NewFlight(DateOnly date, bool isCancelled = false) => new()
    {
        Id = Guid.NewGuid(),
        OriginICAO = "LTFM",
        DestinationICAO = "EGLL",
        FlightTime = TimeSpan.FromHours(2),
        AircraftType = "A320",
        Date = date,
        IsCancelled = isCancelled
    };

    [Fact]
    public async Task Handle_Should_Count_Only_NonCancelled_Flights()
    {
        await using var context = CreateContext();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        context.Flights.AddRange(
            NewFlight(today),
            NewFlight(today, isCancelled: true));
        await context.SaveChangesAsync();

        var handler = new GetStatsQueryHandler(context);

        var result = await handler.Handle(new GetStatsQuery(), CancellationToken.None);

        result.TotalFlights.Should().Be(1);
    }

    [Fact]
    public async Task Handle_Should_Count_Flights_This_Month_Only()
    {
        await using var context = CreateContext();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        context.Flights.AddRange(
            NewFlight(today),
            NewFlight(today.AddMonths(-2)));
        await context.SaveChangesAsync();

        var handler = new GetStatsQueryHandler(context);

        var result = await handler.Handle(new GetStatsQuery(), CancellationToken.None);

        result.FlightsThisMonth.Should().Be(1);
    }

    [Fact]
    public async Task Handle_Should_Group_Pilots_By_Rank()
    {
        await using var context = CreateContext();
        context.Pilots.AddRange(
            NewPilot(PilotRank.Captain),
            NewPilot(PilotRank.Captain),
            NewPilot(PilotRank.Trainee));
        await context.SaveChangesAsync();

        var handler = new GetStatsQueryHandler(context);

        var result = await handler.Handle(new GetStatsQuery(), CancellationToken.None);

        result.TotalPilots.Should().Be(3);
        result.PilotsByRank[PilotRank.Captain].Should().Be(2);
        result.PilotsByRank[PilotRank.Trainee].Should().Be(1);
    }

    [Fact]
    public async Task Handle_Should_List_Pilots_With_Expiring_Certifications()
    {
        await using var context = CreateContext();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var expiringSoon = NewPilot(PilotRank.Captain);
        expiringSoon.LicenseExpiryDate = today.AddDays(10);
        var expiringLater = NewPilot(PilotRank.Captain);
        expiringLater.LicenseExpiryDate = today.AddDays(200);

        context.Pilots.AddRange(expiringSoon, expiringLater);
        await context.SaveChangesAsync();

        var handler = new GetStatsQueryHandler(context);

        var result = await handler.Handle(new GetStatsQuery(), CancellationToken.None);

        result.ExpiringCertifications.Should().ContainSingle(c => c.PilotId == expiringSoon.Id);
    }

    [Fact]
    public async Task Handle_Should_Group_CrmReports_By_Severity()
    {
        await using var context = CreateContext();
        var flight = NewFlight(DateOnly.FromDateTime(DateTime.UtcNow));
        context.Flights.Add(flight);
        context.CRMReports.AddRange(
            new CRMReport
            {
                Id = Guid.NewGuid(), FlightId = flight.Id, Title = "A", Description = "A",
                SeverityLevel = SeverityLevel.High, CreatedDate = DateTime.UtcNow
            },
            new CRMReport
            {
                Id = Guid.NewGuid(), FlightId = flight.Id, Title = "B", Description = "B",
                SeverityLevel = SeverityLevel.Low, CreatedDate = DateTime.UtcNow
            });
        await context.SaveChangesAsync();

        var handler = new GetStatsQueryHandler(context);

        var result = await handler.Handle(new GetStatsQuery(), CancellationToken.None);

        result.TotalCrmReports.Should().Be(2);
        result.CrmReportsBySeverity[SeverityLevel.High].Should().Be(1);
        result.CrmReportsBySeverity[SeverityLevel.Low].Should().Be(1);
    }
}
