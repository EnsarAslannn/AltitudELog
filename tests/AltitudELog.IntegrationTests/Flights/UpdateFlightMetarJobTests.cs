using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.Flights.Jobs;
using AltitudELog.Domain.Entities;
using AltitudELog.Infrastructure.Persistence;
using AltitudELog.IntegrationTests.Infrastructure;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AltitudELog.IntegrationTests.Flights;

[Collection("Integration")]
public class UpdateFlightMetarJobTests : IAsyncLifetime
{
    private readonly IntegrationTestWebAppFactory _factory;

    public UpdateFlightMetarJobTests(IntegrationTestWebAppFactory factory)
    {
        _factory = factory;
    }

    public Task InitializeAsync() => _factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    private static Flight NewFlight() => new()
    {
        Id = Guid.NewGuid(),
        OriginICAO = "LTFM",
        DestinationICAO = "EGLL",
        FlightTime = TimeSpan.FromHours(4),
        AircraftType = "A350",
        Date = DateOnly.FromDateTime(DateTime.UtcNow),
        METARInfo = null
    };

    [Fact]
    public async Task ExecuteAsync_When_Metar_Is_Null_Leaves_Flight_Unchanged_And_Does_Not_Throw()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var flight = NewFlight();
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        var metarService = Substitute.For<IMetarService>();
        metarService.GetRawMetarAsync(flight.OriginICAO, Arg.Any<CancellationToken>()).Returns((string?)null);

        var job = new UpdateFlightMetarJob(
            context,
            metarService,
            scope.ServiceProvider.GetRequiredService<ILogger<UpdateFlightMetarJob>>());

        var act = () => job.ExecuteAsync(flight.Id, flight.OriginICAO, CancellationToken.None);

        await act.Should().NotThrowAsync();

        var reloaded = await context.Flights.AsNoTracking().SingleAsync(f => f.Id == flight.Id);
        reloaded.METARInfo.Should().BeNull();
    }

    [Fact]
    public async Task ExecuteAsync_When_Metar_Is_Returned_Updates_Flight_METARInfo()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var flight = NewFlight();
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        const string rawMetar = "LTFM 181250Z 09006KT 9999 FEW030 22/12 Q1015 NOSIG";
        var metarService = Substitute.For<IMetarService>();
        metarService.GetRawMetarAsync(flight.OriginICAO, Arg.Any<CancellationToken>()).Returns(rawMetar);

        var job = new UpdateFlightMetarJob(
            context,
            metarService,
            scope.ServiceProvider.GetRequiredService<ILogger<UpdateFlightMetarJob>>());

        await job.ExecuteAsync(flight.Id, flight.OriginICAO, CancellationToken.None);

        var reloaded = await context.Flights.AsNoTracking().SingleAsync(f => f.Id == flight.Id);
        reloaded.METARInfo.Should().Be(rawMetar);
    }
}
