using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.CRMReports.Commands.CreateCRMReport;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AltitudELog.Application.UnitTests.CRMReports.Commands.CreateCRMReport;

public class CreateCRMReportCommandHandlerTests
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
    public async Task Handle_Should_Attribute_Report_To_Current_Pilot_Even_When_Anonymous()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        var reporterId = Guid.NewGuid();
        var currentUserService = Substitute.For<ICurrentUserService>();
        currentUserService.PilotId.Returns(reporterId);

        var handler = new CreateCRMReportCommandHandler(
            context, currentUserService, Substitute.For<ILogger<CreateCRMReportCommandHandler>>());

        var command = new CreateCRMReportCommand(
            flight.Id, "Unstable approach", "Description of the event.", IsAnonymous: true, SeverityLevel.Medium);

        var reportId = await handler.Handle(command, CancellationToken.None);

        var report = await context.CRMReports.SingleAsync(r => r.Id == reportId);
        report.ReporterId.Should().Be(reporterId);
        report.IsAnonymous.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_Should_Attribute_Report_To_Current_Pilot_When_Not_Anonymous()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        var reporterId = Guid.NewGuid();
        var currentUserService = Substitute.For<ICurrentUserService>();
        currentUserService.PilotId.Returns(reporterId);

        var handler = new CreateCRMReportCommandHandler(
            context, currentUserService, Substitute.For<ILogger<CreateCRMReportCommandHandler>>());

        var command = new CreateCRMReportCommand(
            flight.Id, "Unstable approach", "Description of the event.", IsAnonymous: false, SeverityLevel.High);

        var reportId = await handler.Handle(command, CancellationToken.None);

        var report = await context.CRMReports.SingleAsync(r => r.Id == reportId);
        report.ReporterId.Should().Be(reporterId);
        report.IsAnonymous.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_Should_Throw_When_No_Current_Pilot()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        var currentUserService = Substitute.For<ICurrentUserService>();
        currentUserService.PilotId.Returns((Guid?)null);

        var handler = new CreateCRMReportCommandHandler(
            context, currentUserService, Substitute.For<ILogger<CreateCRMReportCommandHandler>>());

        var command = new CreateCRMReportCommand(
            flight.Id, "Unstable approach", "Description of the event.", IsAnonymous: false, SeverityLevel.Low);

        var act = () => handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}
