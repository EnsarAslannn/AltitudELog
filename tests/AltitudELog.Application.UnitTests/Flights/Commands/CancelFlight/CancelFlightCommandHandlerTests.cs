using AltitudELog.Application.Common.Caching;
using AltitudELog.Application.Common.Exceptions;
using AltitudELog.Application.Flights.Commands.CancelFlight;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AltitudELog.Application.UnitTests.Flights.Commands.CancelFlight;

public class CancelFlightCommandHandlerTests
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
    public async Task Handle_Should_Invalidate_Crewed_Pilots_Profile_Cache()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        var pilot = NewPilot();
        context.Flights.Add(flight);
        context.Pilots.Add(pilot);
        context.Crew.Add(new AltitudELog.Domain.Entities.Crew { Id = Guid.NewGuid(), FlightId = flight.Id, PilotId = pilot.Id, DutyRole = DutyRole.PIC });
        await context.SaveChangesAsync();

        var handler = new CancelFlightCommandHandler(context, Substitute.For<ILogger<CancelFlightCommandHandler>>());
        var command = new CancelFlightCommand(flight.Id);

        await handler.Handle(command, CancellationToken.None);

        command.CacheKeysToInvalidate.Should().Contain(CacheKeys.PilotProfile(pilot.Id));
    }

    [Fact]
    public async Task Handle_Should_Throw_NotFound_When_Flight_Does_Not_Exist()
    {
        await using var context = CreateContext();
        var handler = new CancelFlightCommandHandler(context, Substitute.For<ILogger<CancelFlightCommandHandler>>());

        var act = () => handler.Handle(new CancelFlightCommand(Guid.NewGuid()), CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_Should_Mark_Flight_As_Cancelled()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        var handler = new CancelFlightCommandHandler(context, Substitute.For<ILogger<CancelFlightCommandHandler>>());

        await handler.Handle(new CancelFlightCommand(flight.Id), CancellationToken.None);

        var updated = await context.Flights.SingleAsync(f => f.Id == flight.Id);
        updated.IsCancelled.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_Should_Throw_When_Flight_Already_Cancelled()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        flight.IsCancelled = true;
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        var handler = new CancelFlightCommandHandler(context, Substitute.For<ILogger<CancelFlightCommandHandler>>());

        var act = () => handler.Handle(new CancelFlightCommand(flight.Id), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }
}
