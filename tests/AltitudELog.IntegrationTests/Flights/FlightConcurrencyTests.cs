using AltitudELog.Domain.Entities;
using AltitudELog.Infrastructure.Persistence;
using AltitudELog.IntegrationTests.Infrastructure;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AltitudELog.IntegrationTests.Flights;

[Collection("Integration")]
public class FlightConcurrencyTests : IAsyncLifetime
{
    private readonly IntegrationTestWebAppFactory _factory;

    public FlightConcurrencyTests(IntegrationTestWebAppFactory factory)
    {
        _factory = factory;
    }

    public Task InitializeAsync() => _factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Concurrent_Saves_On_Same_Flight_Throw_DbUpdateConcurrencyException()
    {
        var flightId = Guid.NewGuid();

        using (var seedScope = _factory.Services.CreateScope())
        {
            var seedContext = seedScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            seedContext.Flights.Add(new Flight
            {
                Id = flightId,
                OriginICAO = "LTFM",
                DestinationICAO = "EGLL",
                FlightTime = TimeSpan.FromHours(4),
                AircraftType = "A350",
                Date = DateOnly.FromDateTime(DateTime.UtcNow)
            });
            await seedContext.SaveChangesAsync();
        }

        using var scopeA = _factory.Services.CreateScope();
        using var scopeB = _factory.Services.CreateScope();
        var contextA = scopeA.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var contextB = scopeB.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var flightA = await contextA.Flights.SingleAsync(f => f.Id == flightId);
        var flightB = await contextB.Flights.SingleAsync(f => f.Id == flightId);

        flightA.AircraftType = "A320";
        await contextA.SaveChangesAsync();

        flightB.AircraftType = "B738";
        var act = () => contextB.SaveChangesAsync();

        await act.Should().ThrowAsync<DbUpdateConcurrencyException>();
    }
}
