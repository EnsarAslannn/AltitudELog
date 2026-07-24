using AltitudELog.Application.Flights.Queries.GetFlightById;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.UnitTests.Flights.Queries.GetFlightById;

public class GetFlightByIdQueryHandlerTests
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
        Date = DateOnly.FromDateTime(DateTime.UtcNow),
        METARInfo = "METAR LTFM 241200Z"
    };

    [Fact]
    public async Task Handle_Should_Return_Flight_Dto_When_It_Exists()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        var handler = new GetFlightByIdQueryHandler(context);

        var result = await handler.Handle(new GetFlightByIdQuery(flight.Id), CancellationToken.None);

        result.Should().NotBeNull();
        result!.Id.Should().Be(flight.Id);
        result.OriginICAO.Should().Be("LTFM");
        result.METARInfo.Should().Be("METAR LTFM 241200Z");
    }

    [Fact]
    public async Task Handle_Should_Return_Null_When_Flight_Does_Not_Exist()
    {
        await using var context = CreateContext();
        var handler = new GetFlightByIdQueryHandler(context);

        var result = await handler.Handle(new GetFlightByIdQuery(Guid.NewGuid()), CancellationToken.None);

        result.Should().BeNull();
    }
}
