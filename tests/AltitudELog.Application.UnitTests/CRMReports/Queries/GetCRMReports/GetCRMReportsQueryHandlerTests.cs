using AltitudELog.Application.CRMReports.Queries.GetCRMReports;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.UnitTests.CRMReports.Queries.GetCRMReports;

public class GetCRMReportsQueryHandlerTests
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
        Date = new DateOnly(2026, 5, 4)
    };

    private static Pilot NewPilot() => new()
    {
        Id = Guid.NewGuid(),
        Name = "Ada Lovelace",
        LicenseNumber = $"LIC-{Guid.NewGuid():N}",
        Rank = PilotRank.Captain,
        Username = $"pilot_{Guid.NewGuid():N}",
        PasswordHash = "hash"
    };

    private static CRMReport NewReport(
        Flight flight,
        SeverityLevel severity = SeverityLevel.Low,
        CRMReportStatus status = CRMReportStatus.Open,
        string title = "Report",
        string description = "Details",
        DateTime? createdDate = null,
        Pilot? reporter = null,
        bool isAnonymous = false) => new()
        {
            Id = Guid.NewGuid(),
            FlightId = flight.Id,
            Title = title,
            Description = description,
            SeverityLevel = severity,
            Status = status,
            CreatedDate = createdDate ?? new DateTime(2026, 5, 4, 12, 0, 0, DateTimeKind.Utc),
            IsAnonymous = isAnonymous,
            ReporterId = reporter?.Id
        };

    [Fact]
    public async Task Handle_Should_Return_Every_Report_With_Its_Flight_Route()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        context.CRMReports.Add(NewReport(flight, title: "Runway incursion"));
        await context.SaveChangesAsync();

        var result = await new GetCRMReportsQueryHandler(context)
            .Handle(new GetCRMReportsQuery(), CancellationToken.None);

        result.TotalCount.Should().Be(1);
        var item = result.Items.Single();
        item.Title.Should().Be("Runway incursion");
        item.OriginICAO.Should().Be("LTFM");
        item.DestinationICAO.Should().Be("EGLL");
        item.FlightDate.Should().Be(new DateOnly(2026, 5, 4));
    }

    [Fact]
    public async Task Handle_Should_Mask_The_Reporter_Of_An_Anonymous_Report()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        var pilot = NewPilot();
        context.Flights.Add(flight);
        context.Pilots.Add(pilot);
        context.CRMReports.Add(NewReport(flight, reporter: pilot, isAnonymous: true));
        context.CRMReports.Add(NewReport(flight, reporter: pilot, title: "Named"));
        await context.SaveChangesAsync();

        var result = await new GetCRMReportsQueryHandler(context)
            .Handle(new GetCRMReportsQuery(), CancellationToken.None);

        var anonymous = result.Items.Single(r => r.IsAnonymous);
        anonymous.ReporterId.Should().BeNull();
        anonymous.ReporterName.Should().BeNull();

        var named = result.Items.Single(r => !r.IsAnonymous);
        named.ReporterId.Should().Be(pilot.Id);
        named.ReporterName.Should().Be("Ada Lovelace");
    }

    [Fact]
    public async Task Handle_Should_Filter_By_Status_And_Count_Over_The_Filtered_Set()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        context.CRMReports.Add(NewReport(flight, status: CRMReportStatus.Open));
        context.CRMReports.Add(NewReport(flight, status: CRMReportStatus.UnderReview));
        context.CRMReports.Add(NewReport(flight, status: CRMReportStatus.Closed));
        await context.SaveChangesAsync();

        var result = await new GetCRMReportsQueryHandler(context)
            .Handle(new GetCRMReportsQuery { Status = CRMReportStatus.Open }, CancellationToken.None);

        result.TotalCount.Should().Be(1);
        result.OpenCount.Should().Be(1);
        result.UnderReviewCount.Should().Be(0);
    }

    [Fact]
    public async Task Handle_Should_Count_Unclosed_Critical_Reports()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        context.CRMReports.Add(NewReport(flight, SeverityLevel.Critical, CRMReportStatus.Open));
        context.CRMReports.Add(NewReport(flight, SeverityLevel.Critical, CRMReportStatus.UnderReview));
        context.CRMReports.Add(NewReport(flight, SeverityLevel.Critical, CRMReportStatus.Closed));
        context.CRMReports.Add(NewReport(flight, SeverityLevel.Low, CRMReportStatus.Open));
        await context.SaveChangesAsync();

        var result = await new GetCRMReportsQueryHandler(context)
            .Handle(new GetCRMReportsQuery(), CancellationToken.None);

        result.CriticalOpenCount.Should().Be(2);
    }

    [Fact]
    public async Task Handle_Should_Match_Search_Across_Title_And_Description()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        context.CRMReports.Add(NewReport(flight, title: "Bird strike", description: "On climb"));
        context.CRMReports.Add(NewReport(flight, title: "Fuel imbalance", description: "Bird seen later"));
        context.CRMReports.Add(NewReport(flight, title: "Nothing", description: "Unrelated"));
        await context.SaveChangesAsync();

        var result = await new GetCRMReportsQueryHandler(context)
            .Handle(new GetCRMReportsQuery { Search = "bird" }, CancellationToken.None);

        result.TotalCount.Should().Be(2);
    }

    [Fact]
    public async Task Handle_Should_Sort_By_Real_Severity_Rank_Not_Alphabetically()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        context.CRMReports.Add(NewReport(flight, SeverityLevel.Low, title: "low"));
        context.CRMReports.Add(NewReport(flight, SeverityLevel.Critical, title: "critical"));
        context.CRMReports.Add(NewReport(flight, SeverityLevel.Medium, title: "medium"));
        context.CRMReports.Add(NewReport(flight, SeverityLevel.High, title: "high"));
        await context.SaveChangesAsync();

        var result = await new GetCRMReportsQueryHandler(context).Handle(
            new GetCRMReportsQuery { SortBy = CRMReportSortField.SeverityLevel, SortDescending = true },
            CancellationToken.None);

        result.Items.Select(r => r.Title).Should().Equal("critical", "high", "medium", "low");
    }

    [Fact]
    public async Task Handle_Should_Sort_A_Status_Queue_Open_First()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        context.CRMReports.Add(NewReport(flight, status: CRMReportStatus.Closed, title: "closed"));
        context.CRMReports.Add(NewReport(flight, status: CRMReportStatus.Open, title: "open"));
        context.CRMReports.Add(NewReport(flight, status: CRMReportStatus.UnderReview, title: "review"));
        await context.SaveChangesAsync();

        var result = await new GetCRMReportsQueryHandler(context).Handle(
            new GetCRMReportsQuery { SortBy = CRMReportSortField.Status, SortDescending = false },
            CancellationToken.None);

        result.Items.Select(r => r.Title).Should().Equal("open", "review", "closed");
    }

    [Fact]
    public async Task Handle_Should_Treat_DateTo_As_Inclusive_Of_The_Whole_Day()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        context.CRMReports.Add(NewReport(
            flight, createdDate: new DateTime(2026, 5, 4, 23, 59, 0, DateTimeKind.Utc), title: "late"));
        context.CRMReports.Add(NewReport(
            flight, createdDate: new DateTime(2026, 5, 5, 0, 1, 0, DateTimeKind.Utc), title: "next day"));
        await context.SaveChangesAsync();

        var result = await new GetCRMReportsQueryHandler(context).Handle(
            new GetCRMReportsQuery { DateTo = new DateOnly(2026, 5, 4) }, CancellationToken.None);

        result.Items.Select(r => r.Title).Should().Equal("late");
    }

    [Fact]
    public async Task Handle_Should_Page_Without_Overlap()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        for (var i = 0; i < 5; i++)
        {
            context.CRMReports.Add(NewReport(flight, title: $"report-{i}"));
        }
        await context.SaveChangesAsync();

        var handler = new GetCRMReportsQueryHandler(context);

        var first = await handler.Handle(
            new GetCRMReportsQuery { PageNumber = 1, PageSize = 2 }, CancellationToken.None);
        var second = await handler.Handle(
            new GetCRMReportsQuery { PageNumber = 2, PageSize = 2 }, CancellationToken.None);

        first.TotalCount.Should().Be(5);
        first.Items.Should().HaveCount(2);
        first.Items.Select(r => r.Id).Should().NotIntersectWith(second.Items.Select(r => r.Id));
    }
}
