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

    private static Flight NewFlight(DateOnly date, string aircraftType, bool isCancelled = false) => new()
    {
        Id = Guid.NewGuid(),
        OriginICAO = "LTFM",
        DestinationICAO = "EGLL",
        FlightTime = TimeSpan.FromHours(4),
        AircraftType = aircraftType,
        Date = date,
        IsCancelled = isCancelled
    };

    [Fact]
    public async Task Handle_Should_Return_Flights_As_Dtos_With_Aggregates()
    {
        await using var context = CreateContext();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        context.Flights.AddRange(
            NewFlight(today, "A350"),
            NewFlight(today, "B777", isCancelled: true));
        await context.SaveChangesAsync();

        var handler = new GetFlightsQueryHandler(context);

        var result = await handler.Handle(new GetFlightsQuery(), CancellationToken.None);

        result.Items.Should().HaveCount(2);
        result.Items.Should().Contain(f => f.AircraftType == "A350" && !f.IsCancelled);
        result.Items.Should().Contain(f => f.AircraftType == "B777" && f.IsCancelled);
        result.TotalCount.Should().Be(2);
        result.ThisMonthCount.Should().Be(2);
        result.DistinctAircraftTypeCount.Should().Be(2);
        result.PageNumber.Should().Be(1);
        result.PageSize.Should().Be(20);
    }

    [Fact]
    public async Task Handle_Should_Return_Empty_Page_When_No_Flights_Exist()
    {
        await using var context = CreateContext();
        var handler = new GetFlightsQueryHandler(context);

        var result = await handler.Handle(new GetFlightsQuery(), CancellationToken.None);

        result.Items.Should().BeEmpty();
        result.TotalCount.Should().Be(0);
        result.ThisMonthCount.Should().Be(0);
        result.DistinctAircraftTypeCount.Should().Be(0);
    }

    [Fact]
    public async Task Handle_Should_Return_Correct_Page_Of_Results_Ordered_By_Date_Descending()
    {
        await using var context = CreateContext();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        for (var i = 0; i < 5; i++)
        {
            context.Flights.Add(NewFlight(today.AddDays(-i), $"Type{i}"));
        }
        await context.SaveChangesAsync();

        var handler = new GetFlightsQueryHandler(context);

        var page1 = await handler.Handle(new GetFlightsQuery { PageNumber = 1, PageSize = 2 }, CancellationToken.None);
        var page2 = await handler.Handle(new GetFlightsQuery { PageNumber = 2, PageSize = 2 }, CancellationToken.None);
        var page3 = await handler.Handle(new GetFlightsQuery { PageNumber = 3, PageSize = 2 }, CancellationToken.None);

        page1.Items.Should().HaveCount(2);
        page1.Items[0].AircraftType.Should().Be("Type0");
        page1.Items[1].AircraftType.Should().Be("Type1");
        page2.Items.Should().HaveCount(2);
        page2.Items[0].AircraftType.Should().Be("Type2");
        page2.Items[1].AircraftType.Should().Be("Type3");
        page3.Items.Should().HaveCount(1);
        page3.Items[0].AircraftType.Should().Be("Type4");

        page1.TotalCount.Should().Be(5);
        page2.TotalCount.Should().Be(5);
    }

    [Fact]
    public async Task Handle_Should_Return_Empty_Items_For_Page_Beyond_Available_Results()
    {
        await using var context = CreateContext();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        context.Flights.Add(NewFlight(today, "A350"));
        await context.SaveChangesAsync();

        var handler = new GetFlightsQueryHandler(context);

        var result = await handler.Handle(
            new GetFlightsQuery { PageNumber = 5, PageSize = 20 }, CancellationToken.None);

        result.Items.Should().BeEmpty();
        result.TotalCount.Should().Be(1);
    }

    [Fact]
    public async Task Handle_Should_Only_Count_Current_Month_Flights_In_ThisMonthCount()
    {
        await using var context = CreateContext();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var lastMonth = today.AddMonths(-1);
        context.Flights.AddRange(
            NewFlight(today, "A350"),
            NewFlight(lastMonth, "B777"));
        await context.SaveChangesAsync();

        var handler = new GetFlightsQueryHandler(context);

        var result = await handler.Handle(new GetFlightsQuery(), CancellationToken.None);

        result.TotalCount.Should().Be(2);
        result.ThisMonthCount.Should().Be(1);
    }
}
