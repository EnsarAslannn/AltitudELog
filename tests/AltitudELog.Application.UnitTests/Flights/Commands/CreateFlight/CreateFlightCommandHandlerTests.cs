using AltitudELog.Application.Flights.Commands.CreateFlight;
using AltitudELog.Application.Flights.Events;
using AltitudELog.Application.UnitTests.TestUtilities;
using AwesomeAssertions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AltitudELog.Application.UnitTests.Flights.Commands.CreateFlight;

public class CreateFlightCommandHandlerTests
{
    private static TestApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestApplicationDbContext(options);
    }

    private static CreateFlightCommand ValidCommand() => new(
        OriginICAO: "LTFM",
        DestinationICAO: "EGLL",
        FlightTime: TimeSpan.FromHours(4),
        AircraftType: "A350",
        Date: DateOnly.FromDateTime(DateTime.UtcNow),
        METARInfo: null);

    [Fact]
    public async Task Handle_Should_Persist_Flight_And_Return_Its_Id()
    {
        await using var context = CreateContext();
        var handler = new CreateFlightCommandHandler(
            context,
            Substitute.For<IPublisher>(),
            Substitute.For<ILogger<CreateFlightCommandHandler>>());

        var flightId = await handler.Handle(ValidCommand(), CancellationToken.None);

        flightId.Should().NotBe(Guid.Empty);

        var storedFlight = await context.Flights.SingleAsync(f => f.Id == flightId);
        storedFlight.OriginICAO.Should().Be("LTFM");
        storedFlight.DestinationICAO.Should().Be("EGLL");
    }

    [Fact]
    public async Task Handle_Should_Publish_FlightCreatedEvent_With_Origin_Icao()
    {
        await using var context = CreateContext();
        var publisher = Substitute.For<IPublisher>();
        var handler = new CreateFlightCommandHandler(
            context,
            publisher,
            Substitute.For<ILogger<CreateFlightCommandHandler>>());

        var flightId = await handler.Handle(ValidCommand(), CancellationToken.None);

        await publisher.Received(1).Publish(
            Arg.Is<FlightCreatedEvent>(e => e.FlightId == flightId && e.OriginICAO == "LTFM"),
            Arg.Any<CancellationToken>());
    }
}
