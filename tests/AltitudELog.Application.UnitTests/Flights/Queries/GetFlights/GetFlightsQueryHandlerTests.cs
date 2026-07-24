using AltitudELog.Application.Flights.Queries.GetFlights;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.UnitTests.Flights.Queries.GetFlights;

public class GetFlightsQueryHandlerTests
{
    private static TestApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestApplicationDbContext(options);
    }

    [Fact]
    public async Task Handle_Should_Return_All_Flights_As_Dtos()
    {
        await using var context = CreateContext();
        context.Flights.AddRange(
            new Flight
            {
                Id = Guid.NewGuid(),
                OriginICAO = "LTFM",
                DestinationICAO = "EGLL",
                FlightTime = TimeSpan.FromHours(4),
                AircraftType = "A350",
                Date = DateOnly.FromDateTime(DateTime.UtcNow)
            },
            new Flight
            {
                Id = Guid.NewGuid(),
                OriginICAO = "LTBA",
                DestinationICAO = "KJFK",
                FlightTime = TimeSpan.FromHours(10),
                AircraftType = "B777",
                Date = DateOnly.FromDateTime(DateTime.UtcNow),
                IsCancelled = true
            });
        await context.SaveChangesAsync();

        var handler = new GetFlightsQueryHandler(context);

        var result = await handler.Handle(new GetFlightsQuery(), CancellationToken.None);

        result.Should().HaveCount(2);
        result.Should().Contain(f => f.OriginICAO == "LTFM" && !f.IsCancelled);
        result.Should().Contain(f => f.OriginICAO == "LTBA" && f.IsCancelled);
    }

    [Fact]
    public async Task Handle_Should_Return_Empty_List_When_No_Flights_Exist()
    {
        await using var context = CreateContext();
        var handler = new GetFlightsQueryHandler(context);

        var result = await handler.Handle(new GetFlightsQuery(), CancellationToken.None);

        result.Should().BeEmpty();
    }
}
