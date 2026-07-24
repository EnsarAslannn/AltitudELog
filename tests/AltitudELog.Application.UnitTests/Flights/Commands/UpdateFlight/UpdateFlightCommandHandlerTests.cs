using AltitudELog.Application.Common.Exceptions;
using AltitudELog.Application.Flights.Commands.UpdateFlight;
using AltitudELog.Application.Flights.Events;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AwesomeAssertions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AltitudELog.Application.UnitTests.Flights.Commands.UpdateFlight;

public class UpdateFlightCommandHandlerTests
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

    [Fact]
    public async Task Handle_Should_Throw_NotFound_When_Flight_Does_Not_Exist()
    {
        await using var context = CreateContext();
        var handler = new UpdateFlightCommandHandler(
            context, Substitute.For<IPublisher>(), Substitute.For<ILogger<UpdateFlightCommandHandler>>());

        var command = new UpdateFlightCommand(
            Guid.NewGuid(), "LTFM", "EGLL", TimeSpan.FromHours(2), "A320", DateOnly.FromDateTime(DateTime.UtcNow));

        var act = () => handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_Should_Update_Flight_Fields()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        var handler = new UpdateFlightCommandHandler(
            context, Substitute.For<IPublisher>(), Substitute.For<ILogger<UpdateFlightCommandHandler>>());

        var command = new UpdateFlightCommand(
            flight.Id, flight.OriginICAO, "LTBA", TimeSpan.FromHours(1), "A320", DateOnly.FromDateTime(DateTime.UtcNow));

        await handler.Handle(command, CancellationToken.None);

        var updated = await context.Flights.SingleAsync(f => f.Id == flight.Id);
        updated.DestinationICAO.Should().Be("LTBA");
        updated.AircraftType.Should().Be("A320");
    }

    [Fact]
    public async Task Handle_Should_Publish_FlightUpdatedEvent_And_Clear_Metar_When_Origin_Changes()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        flight.METARInfo = "existing metar";
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        var publisher = Substitute.For<IPublisher>();
        var handler = new UpdateFlightCommandHandler(
            context, publisher, Substitute.For<ILogger<UpdateFlightCommandHandler>>());

        var command = new UpdateFlightCommand(
            flight.Id, "LTBA", "EGLL", TimeSpan.FromHours(4), "A350", DateOnly.FromDateTime(DateTime.UtcNow));

        await handler.Handle(command, CancellationToken.None);

        var updated = await context.Flights.SingleAsync(f => f.Id == flight.Id);
        updated.METARInfo.Should().BeNull();

        await publisher.Received(1).Publish(
            Arg.Is<FlightUpdatedEvent>(e => e.FlightId == flight.Id && e.OriginICAO == "LTBA"),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_Should_Not_Publish_FlightUpdatedEvent_When_Origin_Unchanged()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        var publisher = Substitute.For<IPublisher>();
        var handler = new UpdateFlightCommandHandler(
            context, publisher, Substitute.For<ILogger<UpdateFlightCommandHandler>>());

        var command = new UpdateFlightCommand(
            flight.Id, flight.OriginICAO, "LTBA", TimeSpan.FromHours(2), "A320", DateOnly.FromDateTime(DateTime.UtcNow));

        await handler.Handle(command, CancellationToken.None);

        await publisher.DidNotReceive().Publish(Arg.Any<FlightUpdatedEvent>(), Arg.Any<CancellationToken>());
    }
}
