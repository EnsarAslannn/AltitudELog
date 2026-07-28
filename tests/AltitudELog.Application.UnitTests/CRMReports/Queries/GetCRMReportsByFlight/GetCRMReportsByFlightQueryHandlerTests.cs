using AltitudELog.Application.CRMReports.Queries.GetCRMReportsByFlight;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.UnitTests.CRMReports.Queries.GetCRMReportsByFlight;

public class GetCRMReportsByFlightQueryHandlerTests
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

    private static Pilot NewPilot(string name) => new()
    {
        Id = Guid.NewGuid(),
        Name = name,
        LicenseNumber = Guid.NewGuid().ToString("N")[..10],
        Rank = PilotRank.Captain,
        Username = Guid.NewGuid().ToString("N")[..10],
        PasswordHash = "hash"
    };

    [Fact]
    public async Task Handle_Should_Mask_Reporter_Identity_When_Anonymous()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        var reporter = NewPilot("Jane Reporter");
        context.Flights.Add(flight);
        context.Pilots.Add(reporter);
        context.CRMReports.Add(new CRMReport
        {
            Id = Guid.NewGuid(),
            FlightId = flight.Id,
            Title = "Unstable approach",
            Description = "Description of the event.",
            IsAnonymous = true,
            SeverityLevel = SeverityLevel.Medium,
            CreatedDate = DateTime.UtcNow,
            ReporterId = reporter.Id
        });
        await context.SaveChangesAsync();

        var handler = new GetCRMReportsByFlightQueryHandler(context);
        var result = await handler.Handle(new GetCRMReportsByFlightQuery(flight.Id), CancellationToken.None);

        result.Should().ContainSingle();
        result[0].ReporterId.Should().BeNull();
        result[0].ReporterName.Should().BeNull();
    }

    [Fact]
    public async Task Handle_Should_Expose_Reporter_Identity_When_Not_Anonymous()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        var reporter = NewPilot("Jane Reporter");
        context.Flights.Add(flight);
        context.Pilots.Add(reporter);
        context.CRMReports.Add(new CRMReport
        {
            Id = Guid.NewGuid(),
            FlightId = flight.Id,
            Title = "Unstable approach",
            Description = "Description of the event.",
            IsAnonymous = false,
            SeverityLevel = SeverityLevel.High,
            CreatedDate = DateTime.UtcNow,
            ReporterId = reporter.Id
        });
        await context.SaveChangesAsync();

        var handler = new GetCRMReportsByFlightQueryHandler(context);
        var result = await handler.Handle(new GetCRMReportsByFlightQuery(flight.Id), CancellationToken.None);

        result.Should().ContainSingle();
        result[0].ReporterId.Should().Be(reporter.Id);
        result[0].ReporterName.Should().Be(reporter.Name);
    }

    [Fact]
    public async Task Handle_Should_Mask_Only_Anonymous_Reports_On_Same_Flight()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        var anonymousReporter = NewPilot("Anon Reporter");
        var namedReporter = NewPilot("Named Reporter");
        context.Flights.Add(flight);
        context.Pilots.AddRange(anonymousReporter, namedReporter);
        context.CRMReports.AddRange(
            new CRMReport
            {
                Id = Guid.NewGuid(),
                FlightId = flight.Id,
                Title = "Anonymous report",
                Description = "Description of the event.",
                IsAnonymous = true,
                SeverityLevel = SeverityLevel.Low,
                CreatedDate = DateTime.UtcNow,
                ReporterId = anonymousReporter.Id
            },
            new CRMReport
            {
                Id = Guid.NewGuid(),
                FlightId = flight.Id,
                Title = "Named report",
                Description = "Description of the event.",
                IsAnonymous = false,
                SeverityLevel = SeverityLevel.Low,
                CreatedDate = DateTime.UtcNow,
                ReporterId = namedReporter.Id
            });
        await context.SaveChangesAsync();

        var handler = new GetCRMReportsByFlightQueryHandler(context);
        var result = await handler.Handle(new GetCRMReportsByFlightQuery(flight.Id), CancellationToken.None);

        result.Should().HaveCount(2);
        result.Single(r => r.Title == "Anonymous report").ReporterId.Should().BeNull();
        result.Single(r => r.Title == "Anonymous report").ReporterName.Should().BeNull();
        result.Single(r => r.Title == "Named report").ReporterId.Should().Be(namedReporter.Id);
        result.Single(r => r.Title == "Named report").ReporterName.Should().Be(namedReporter.Name);
    }
}
