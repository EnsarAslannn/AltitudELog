using AltitudELog.Application.Flights.Queries.GetFlights;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.UnitTests.Flights.Queries.GetFlights;

public class GetFlightsFilteringTests
{
    private static readonly DateOnly Today = DateOnly.FromDateTime(DateTime.UtcNow);

    private static TestApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestApplicationDbContext(options);
    }

    private static Flight NewFlight(
        string origin,
        string destination,
        string aircraftType,
        DateOnly date,
        TimeSpan? flightTime = null,
        bool isCancelled = false) => new()
        {
            Id = Guid.NewGuid(),
            OriginICAO = origin,
            DestinationICAO = destination,
            FlightTime = flightTime ?? TimeSpan.FromHours(4),
            AircraftType = aircraftType,
            Date = date,
            IsCancelled = isCancelled
        };

    private static async Task<TestApplicationDbContext> SeedAsync()
    {
        var context = CreateContext();
        context.Flights.AddRange(
            NewFlight("LTFM", "EGLL", "A350", Today, TimeSpan.FromHours(4)),
            NewFlight("LTFJ", "EDDF", "A320", Today.AddDays(-10), TimeSpan.FromHours(2)),
            NewFlight("EGLL", "KJFK", "B777", Today.AddDays(-40), TimeSpan.FromHours(8)),
            NewFlight("LTAI", "LTFM", "A320", Today.AddDays(-100), TimeSpan.FromHours(1), isCancelled: true));
        await context.SaveChangesAsync();

        return context;
    }

    private static async Task<FlightsPageResult> RunAsync(TestApplicationDbContext context, GetFlightsQuery query) =>
        await new GetFlightsQueryHandler(context).Handle(query, CancellationToken.None);

    [Fact]
    public async Task Search_Should_Match_Origin_Destination_Or_AircraftType_Case_Insensitively()
    {
        await using var context = await SeedAsync();

        var result = await RunAsync(context, new GetFlightsQuery { Search = "ltf" });

        result.Items.Should().HaveCount(3);
        result.Items.Should().OnlyContain(f =>
            f.OriginICAO.Contains("LTF") || f.DestinationICAO.Contains("LTF"));
    }

    [Fact]
    public async Task Search_Should_Match_A_Partial_AircraftType()
    {
        await using var context = await SeedAsync();

        var result = await RunAsync(context, new GetFlightsQuery { Search = "a3" });

        result.Items.Should().HaveCount(3);
        result.Items.Should().OnlyContain(f => f.AircraftType.StartsWith("A3"));
    }

    [Fact]
    public async Task Date_Range_Should_Be_Inclusive_At_Both_Ends()
    {
        await using var context = await SeedAsync();

        var result = await RunAsync(context, new GetFlightsQuery
        {
            DateFrom = Today.AddDays(-10),
            DateTo = Today
        });

        result.Items.Should().HaveCount(2);
        result.Items.Should().OnlyContain(f => f.Date >= Today.AddDays(-10) && f.Date <= Today);
    }

    [Fact]
    public async Task Origin_And_Destination_Filters_Should_Match_Exactly_And_Ignore_Casing()
    {
        await using var context = await SeedAsync();

        var result = await RunAsync(context, new GetFlightsQuery { OriginICAO = "ltfm" });

        result.Items.Should().ContainSingle();
        result.Items[0].DestinationICAO.Should().Be("EGLL");
    }

    [Fact]
    public async Task IsCancelled_Filter_Should_Narrow_To_One_State_And_Default_To_Both()
    {
        await using var context = await SeedAsync();

        var cancelled = await RunAsync(context, new GetFlightsQuery { IsCancelled = true });
        var active = await RunAsync(context, new GetFlightsQuery { IsCancelled = false });
        var unfiltered = await RunAsync(context, new GetFlightsQuery());

        cancelled.Items.Should().ContainSingle().Which.IsCancelled.Should().BeTrue();
        active.Items.Should().HaveCount(3);
        unfiltered.Items.Should().HaveCount(4);
    }

    [Fact]
    public async Task Counts_Should_Reflect_The_Filtered_Set_Not_The_Whole_Table()
    {
        await using var context = await SeedAsync();

        var result = await RunAsync(context, new GetFlightsQuery { AircraftType = "A320" });

        result.TotalCount.Should().Be(2);
        result.ActiveCount.Should().Be(1);
        result.DistinctAircraftTypeCount.Should().Be(1);
    }

    [Fact]
    public async Task Filters_Should_Combine_As_And()
    {
        await using var context = await SeedAsync();

        var result = await RunAsync(context, new GetFlightsQuery
        {
            AircraftType = "A320",
            IsCancelled = false
        });

        result.Items.Should().ContainSingle().Which.OriginICAO.Should().Be("LTFJ");
    }

    [Fact]
    public async Task No_Filters_Should_Behave_Exactly_As_Before()
    {
        await using var context = await SeedAsync();

        var result = await RunAsync(context, new GetFlightsQuery());

        result.Items.Should().HaveCount(4);
        result.TotalCount.Should().Be(4);
        result.Items.Select(f => f.Date).Should().BeInDescendingOrder();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task SortBy_FlightTime_Should_Order_By_Duration(bool descending)
    {
        await using var context = await SeedAsync();

        var result = await RunAsync(context, new GetFlightsQuery
        {
            SortBy = FlightSortField.FlightTime,
            SortDescending = descending
        });

        var durations = result.Items.Select(f => f.FlightTime);
        if (descending) durations.Should().BeInDescendingOrder();
        else durations.Should().BeInAscendingOrder();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task SortBy_OriginICAO_Should_Order_Alphabetically(bool descending)
    {
        await using var context = await SeedAsync();

        var result = await RunAsync(context, new GetFlightsQuery
        {
            SortBy = FlightSortField.OriginICAO,
            SortDescending = descending
        });

        var origins = result.Items.Select(f => f.OriginICAO);
        if (descending) origins.Should().BeInDescendingOrder();
        else origins.Should().BeInAscendingOrder();
    }

    [Fact]
    public async Task SortBy_AircraftType_Should_Order_By_Type()
    {
        await using var context = await SeedAsync();

        var result = await RunAsync(context, new GetFlightsQuery
        {
            SortBy = FlightSortField.AircraftType,
            SortDescending = false
        });

        result.Items.Select(f => f.AircraftType).Should().BeInAscendingOrder();
        result.Items[0].AircraftType.Should().Be("A320");
    }

    [Fact]
    public async Task Paging_Should_Stay_Stable_When_Many_Rows_Share_A_Sort_Value()
    {
        await using var context = CreateContext();
        for (var i = 0; i < 6; i++)
        {
            context.Flights.Add(NewFlight("LTFM", "EGLL", $"Type{i}", Today));
        }
        await context.SaveChangesAsync();

        var page1 = await RunAsync(context, new GetFlightsQuery { PageNumber = 1, PageSize = 3 });
        var page2 = await RunAsync(context, new GetFlightsQuery { PageNumber = 2, PageSize = 3 });

        page1.Items.Select(f => f.Id).Should().NotIntersectWith(page2.Items.Select(f => f.Id));
        page1.Items.Concat(page2.Items).Select(f => f.Id).Should().OnlyHaveUniqueItems().And.HaveCount(6);
    }
}
