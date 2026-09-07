using AltitudELog.Application.Common.Caching;
using AltitudELog.Application.Common.Exceptions;
using AltitudELog.Application.Crew.Commands.RemoveCrew;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AltitudELog.Application.UnitTests.Crew.Commands.RemoveCrew;

public class RemoveCrewCommandHandlerTests
{
    private static TestApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestApplicationDbContext(options);
    }

    private static Flight NewFlight(bool isCancelled = false) => new()
    {
        Id = Guid.NewGuid(),
        OriginICAO = "LTFM",
        DestinationICAO = "EGLL",
        FlightTime = TimeSpan.FromHours(4),
        AircraftType = "A350",
        Date = DateOnly.FromDateTime(DateTime.UtcNow),
        IsCancelled = isCancelled
    };

    private static Pilot NewPilot() => new()
    {
        Id = Guid.NewGuid(),
        Name = "Test Pilot",
        LicenseNumber = $"LIC-{Guid.NewGuid():N}",
        Rank = PilotRank.Captain,
        Username = $"pilot_{Guid.NewGuid():N}",
        PasswordHash = "hash"
    };

    private static RemoveCrewCommandHandler NewHandler(TestApplicationDbContext context) =>
        new(context, Substitute.For<ILogger<RemoveCrewCommandHandler>>());

    private static async Task<Domain.Entities.Crew> SeedAssignment(
        TestApplicationDbContext context, Flight flight, Pilot pilot)
    {
        var assignment = new Domain.Entities.Crew
        {
            Id = Guid.NewGuid(),
            FlightId = flight.Id,
            PilotId = pilot.Id,
            DutyRole = DutyRole.SIC
        };

        context.Flights.Add(flight);
        context.Pilots.Add(pilot);
        context.Crew.Add(assignment);
        await context.SaveChangesAsync();

        return assignment;
    }

    [Fact]
    public async Task Handle_Should_Remove_The_Assignment_Without_Touching_The_Pilot()
    {
        await using var context = CreateContext();
        var pilot = NewPilot();
        var assignment = await SeedAssignment(context, NewFlight(), pilot);

        await NewHandler(context).Handle(new RemoveCrewCommand(assignment.Id), CancellationToken.None);

        (await context.Crew.AnyAsync(c => c.Id == assignment.Id)).Should().BeFalse();
        (await context.Pilots.AnyAsync(p => p.Id == pilot.Id)).Should().BeTrue();
    }

    [Fact]
    public async Task Handle_Should_Invalidate_The_Flight_Crew_And_Pilot_Profile_Caches()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        var pilot = NewPilot();
        var assignment = await SeedAssignment(context, flight, pilot);
        var command = new RemoveCrewCommand(assignment.Id);

        await NewHandler(context).Handle(command, CancellationToken.None);

        command.CacheKeysToInvalidate.Should().BeEquivalentTo(
            [CacheKeys.CrewByFlight(flight.Id), CacheKeys.PilotProfile(pilot.Id)]);
    }

    [Fact]
    public async Task Handle_Should_Throw_NotFound_When_The_Assignment_Does_Not_Exist()
    {
        await using var context = CreateContext();

        var act = () => NewHandler(context).Handle(new RemoveCrewCommand(Guid.NewGuid()), CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_Should_Refuse_To_Touch_The_Crew_Of_A_Cancelled_Flight()
    {
        await using var context = CreateContext();
        var assignment = await SeedAssignment(context, NewFlight(isCancelled: true), NewPilot());

        var act = () => NewHandler(context).Handle(new RemoveCrewCommand(assignment.Id), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        (await context.Crew.AnyAsync(c => c.Id == assignment.Id)).Should().BeTrue();
    }
}
