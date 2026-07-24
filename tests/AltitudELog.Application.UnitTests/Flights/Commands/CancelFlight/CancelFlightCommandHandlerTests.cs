using AltitudELog.Application.Common.Exceptions;
using AltitudELog.Application.Flights.Commands.CancelFlight;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
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
}
