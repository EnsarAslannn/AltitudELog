using AltitudELog.Application.Pilots.Queries.GetPilotProfile;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using CrewEntity = AltitudELog.Domain.Entities.Crew;

namespace AltitudELog.Application.UnitTests.Pilots.Queries.GetPilotProfile;

public class GetPilotProfileQueryHandlerTests
{
    private static TestApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestApplicationDbContext(options);
    }

    private static Pilot NewPilot() => new()
    {
        Id = Guid.NewGuid(),
        Name = "Test Pilot",
        LicenseNumber = $"LIC-{Guid.NewGuid():N}",
        Rank = PilotRank.Captain,
        Username = $"pilot_{Guid.NewGuid():N}",
        PasswordHash = "hash"
    };

    private static Flight NewFlight(DateOnly date, TimeSpan flightTime, bool isCancelled = false) => new()
    {
        Id = Guid.NewGuid(),
        OriginICAO = "LTFM",
        DestinationICAO = "EGLL",
        FlightTime = flightTime,
        AircraftType = "A350",
        Date = date,
        IsCancelled = isCancelled
    };

    [Fact]
    public async Task Handle_Should_Return_Null_When_Pilot_Does_Not_Exist()
    {
        await using var context = CreateContext();
        var handler = new GetPilotProfileQueryHandler(context);

        var result = await handler.Handle(new GetPilotProfileQuery(Guid.NewGuid()), CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task Handle_Should_Sum_Hours_And_Report_Currency_From_Recent_NonCancelled_Flights()
    {
        await using var context = CreateContext();
        var pilot = NewPilot();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var recentFlight = NewFlight(today.AddDays(-10), TimeSpan.FromHours(3));
        var oldFlight = NewFlight(today.AddDays(-200), TimeSpan.FromHours(2));

        context.Pilots.Add(pilot);
        context.Flights.AddRange(recentFlight, oldFlight);
        context.Crew.AddRange(
            new CrewEntity { Id = Guid.NewGuid(), FlightId = recentFlight.Id, PilotId = pilot.Id, DutyRole = DutyRole.PIC },
            new CrewEntity { Id = Guid.NewGuid(), FlightId = oldFlight.Id, PilotId = pilot.Id, DutyRole = DutyRole.PIC });
        await context.SaveChangesAsync();

        var handler = new GetPilotProfileQueryHandler(context);

        var result = await handler.Handle(new GetPilotProfileQuery(pilot.Id), CancellationToken.None);

        result.Should().NotBeNull();
        result!.TotalFlights.Should().Be(2);
        result.TotalFlightHours.Should().Be(TimeSpan.FromHours(5));
        result.FlightsLast90Days.Should().Be(1);
        result.IsCurrent.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_Should_Exclude_Cancelled_Flights()
    {
        await using var context = CreateContext();
        var pilot = NewPilot();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var cancelledFlight = NewFlight(today.AddDays(-5), TimeSpan.FromHours(4), isCancelled: true);

        context.Pilots.Add(pilot);
        context.Flights.Add(cancelledFlight);
        context.Crew.Add(
            new CrewEntity { Id = Guid.NewGuid(), FlightId = cancelledFlight.Id, PilotId = pilot.Id, DutyRole = DutyRole.PIC });
        await context.SaveChangesAsync();

        var handler = new GetPilotProfileQueryHandler(context);

        var result = await handler.Handle(new GetPilotProfileQuery(pilot.Id), CancellationToken.None);

        result.Should().NotBeNull();
        result!.TotalFlights.Should().Be(0);
        result.TotalFlightHours.Should().Be(TimeSpan.Zero);
        result.IsCurrent.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_Should_Report_Not_Current_When_Last_Flight_Beyond_90_Days()
    {
        await using var context = CreateContext();
        var pilot = NewPilot();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var oldFlight = NewFlight(today.AddDays(-200), TimeSpan.FromHours(2));

        context.Pilots.Add(pilot);
        context.Flights.Add(oldFlight);
        context.Crew.Add(
            new CrewEntity { Id = Guid.NewGuid(), FlightId = oldFlight.Id, PilotId = pilot.Id, DutyRole = DutyRole.PIC });
        await context.SaveChangesAsync();

        var handler = new GetPilotProfileQueryHandler(context);

        var result = await handler.Handle(new GetPilotProfileQuery(pilot.Id), CancellationToken.None);

        result.Should().NotBeNull();
        result!.FlightsLast90Days.Should().Be(0);
        result.IsCurrent.Should().BeFalse();
    }
}
