using AltitudELog.Application.Common.Exceptions;
using AltitudELog.Application.Crew.Commands.CreateCrew;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AltitudELog.Application.UnitTests.Crew.Commands.CreateCrew;

public class CreateCrewCommandHandlerTests
{
    private static TestApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestApplicationDbContext(options);
    }

    private static Flight NewFlight() => new()
    {
        Id = Guid.NewGuid(),
        OriginICAO = "LTFM",
        DestinationICAO = "EGLL",
        FlightTime = TimeSpan.FromHours(4),
        AircraftType = "A350",
        Date = DateOnly.FromDateTime(DateTime.UtcNow)
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

    [Fact]
    public async Task Handle_Should_Assign_Pilot_To_Flight()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        var pilot = NewPilot();
        context.Flights.Add(flight);
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var handler = new CreateCrewCommandHandler(context, Substitute.For<ILogger<CreateCrewCommandHandler>>());
        var command = new CreateCrewCommand(flight.Id, pilot.Id, DutyRole.PIC);

        var crewId = await handler.Handle(command, CancellationToken.None);

        var crew = await context.Crew.SingleAsync(c => c.Id == crewId);
        crew.FlightId.Should().Be(flight.Id);
        crew.PilotId.Should().Be(pilot.Id);
        crew.DutyRole.Should().Be(DutyRole.PIC);
    }

    [Fact]
    public async Task Handle_Should_Throw_When_Pilot_Already_Assigned_To_Flight()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        var pilot = NewPilot();
        context.Flights.Add(flight);
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var handler = new CreateCrewCommandHandler(context, Substitute.For<ILogger<CreateCrewCommandHandler>>());

        await handler.Handle(new CreateCrewCommand(flight.Id, pilot.Id, DutyRole.PIC), CancellationToken.None);

        var act = () => handler.Handle(new CreateCrewCommand(flight.Id, pilot.Id, DutyRole.SIC), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task Handle_Should_Throw_NotFound_When_Flight_Does_Not_Exist()
    {
        await using var context = CreateContext();
        var pilot = NewPilot();
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var handler = new CreateCrewCommandHandler(context, Substitute.For<ILogger<CreateCrewCommandHandler>>());
        var command = new CreateCrewCommand(Guid.NewGuid(), pilot.Id, DutyRole.PIC);

        var act = () => handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_Should_Throw_NotFound_When_Pilot_Does_Not_Exist()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        var handler = new CreateCrewCommandHandler(context, Substitute.For<ILogger<CreateCrewCommandHandler>>());
        var command = new CreateCrewCommand(flight.Id, Guid.NewGuid(), DutyRole.PIC);

        var act = () => handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }
}
