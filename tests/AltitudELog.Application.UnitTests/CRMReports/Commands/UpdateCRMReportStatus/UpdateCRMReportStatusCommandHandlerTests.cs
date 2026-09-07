using AltitudELog.Application.Common.Caching;
using AltitudELog.Application.Common.Exceptions;
using AltitudELog.Application.CRMReports.Commands.UpdateCRMReportStatus;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AltitudELog.Application.UnitTests.CRMReports.Commands.UpdateCRMReportStatus;

public class UpdateCRMReportStatusCommandHandlerTests
{
    private static TestApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestApplicationDbContext(options);
    }

    private static UpdateCRMReportStatusCommandHandler NewHandler(TestApplicationDbContext context) =>
        new(context, Substitute.For<ILogger<UpdateCRMReportStatusCommandHandler>>());

    private static async Task<CRMReport> SeedReport(TestApplicationDbContext context)
    {
        var flight = new Flight
        {
            Id = Guid.NewGuid(),
            OriginICAO = "LTFM",
            DestinationICAO = "EGLL",
            FlightTime = TimeSpan.FromHours(4),
            AircraftType = "A350",
            Date = DateOnly.FromDateTime(DateTime.UtcNow)
        };

        var report = new CRMReport
        {
            Id = Guid.NewGuid(),
            FlightId = flight.Id,
            Title = "Runway incursion",
            Description = "Details",
            SeverityLevel = SeverityLevel.High,
            Status = CRMReportStatus.Open,
            CreatedDate = DateTime.UtcNow
        };

        context.Flights.Add(flight);
        context.CRMReports.Add(report);
        await context.SaveChangesAsync();

        return report;
    }

    [Fact]
    public async Task Handle_Should_Move_The_Report_To_The_Requested_Status()
    {
        await using var context = CreateContext();
        var report = await SeedReport(context);

        await NewHandler(context).Handle(
            new UpdateCRMReportStatusCommand(report.Id, CRMReportStatus.Closed), CancellationToken.None);

        var updated = await context.CRMReports.SingleAsync(r => r.Id == report.Id);
        updated.Status.Should().Be(CRMReportStatus.Closed);
    }

    [Fact]
    public async Task Handle_Should_Invalidate_The_Flights_Reports_And_The_Stats()
    {
        await using var context = CreateContext();
        var report = await SeedReport(context);
        var command = new UpdateCRMReportStatusCommand(report.Id, CRMReportStatus.UnderReview);

        await NewHandler(context).Handle(command, CancellationToken.None);

        command.CacheKeysToInvalidate.Should().BeEquivalentTo(
            [CacheKeys.Stats, CacheKeys.CrmReportsByFlight(report.FlightId)]);
    }

    [Fact]
    public async Task Handle_Should_Throw_NotFound_When_The_Report_Does_Not_Exist()
    {
        await using var context = CreateContext();

        var act = () => NewHandler(context).Handle(
            new UpdateCRMReportStatusCommand(Guid.NewGuid(), CRMReportStatus.Closed), CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }
}
