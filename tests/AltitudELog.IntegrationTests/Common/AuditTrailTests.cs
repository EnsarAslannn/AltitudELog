using System.Net.Http.Headers;
using System.Net.Http.Json;
using AltitudELog.Application.Auth.Commands.Login;
using AltitudELog.Application.Auth.Commands.Register;
using AltitudELog.Application.Flights.Commands.CreateFlight;
using AltitudELog.Application.Flights.Commands.UpdateFlight;
using AltitudELog.Domain.Enums;
using AltitudELog.Infrastructure.Persistence;
using AltitudELog.IntegrationTests.Infrastructure;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AltitudELog.IntegrationTests.Common;

/// <summary>
/// The audit columns are filled by an override on <see cref="ApplicationDbContext"/>, so only a
/// test that goes through the real context can see them — the unit tests run against a plain
/// InMemory context that has no such override, and would pass whether the stamping worked or not.
/// </summary>
[Collection("Integration")]
public class AuditTrailTests : IAsyncLifetime
{
    private readonly IntegrationTestWebAppFactory _factory;
    private readonly HttpClient _client;

    public AuditTrailTests(IntegrationTestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    public Task InitializeAsync() => _factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<Guid> RegisterCaptainAndAuthenticateAsync()
    {
        var username = $"pilot_audit_{Guid.NewGuid():N}";
        var registerCommand = new RegisterCommand(
            username,
            "P@ssw0rd123!",
            "Audit Pilot",
            $"LIC-{Guid.NewGuid():N}",
            $"{username}@example.com",
            PilotRank.Captain);

        var registerResponse = await _client.PostAsJsonAsync("/Auth/register", registerCommand);
        registerResponse.EnsureSuccessStatusCode();
        var pilotId = await registerResponse.Content.ReadFromJsonAsync<Guid>();

        var loginResponse = await _client.PostAsJsonAsync(
            "/Auth/login", new LoginCommand(username, "P@ssw0rd123!"));
        loginResponse.EnsureSuccessStatusCode();

        var auth = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);

        return pilotId;
    }

    private async Task<Guid> CreateFlightAsync()
    {
        var response = await _client.PostAsJsonAsync("/Flights", new CreateFlightCommand(
            OriginICAO: "LTFM",
            DestinationICAO: "EGLL",
            FlightTime: TimeSpan.FromHours(4),
            AircraftType: "A350",
            Date: DateOnly.FromDateTime(DateTime.UtcNow)));

        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<Guid>();
    }

    [Fact]
    public async Task Creating_A_Flight_Records_Who_Created_It_And_Leaves_The_Update_Half_Empty()
    {
        var pilotId = await RegisterCaptainAndAuthenticateAsync();
        var flightId = await CreateFlightAsync();

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var flight = await context.Flights.AsNoTracking().SingleAsync(f => f.Id == flightId);

        flight.CreatedByPilotId.Should().Be(pilotId);
        flight.CreatedAtUtc.Should().NotBeNull().And.Subject.As<DateTime>()
            .Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(5));

        flight.UpdatedAtUtc.Should().BeNull("nothing has modified the row yet");
        flight.UpdatedByPilotId.Should().BeNull();
    }

    [Fact]
    public async Task Updating_A_Flight_Records_Who_Changed_It_Without_Losing_Who_Created_It()
    {
        var pilotId = await RegisterCaptainAndAuthenticateAsync();
        var flightId = await CreateFlightAsync();

        var updateResponse = await _client.PutAsJsonAsync($"/Flights/{flightId}", new UpdateFlightCommand(
            FlightId: flightId,
            OriginICAO: "LTFM",
            DestinationICAO: "LFPG",
            FlightTime: TimeSpan.FromHours(3),
            AircraftType: "A350",
            Date: DateOnly.FromDateTime(DateTime.UtcNow)));

        updateResponse.EnsureSuccessStatusCode();

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var flight = await context.Flights.AsNoTracking().SingleAsync(f => f.Id == flightId);

        flight.CreatedByPilotId.Should().Be(pilotId);
        flight.UpdatedByPilotId.Should().Be(pilotId);
        flight.UpdatedAtUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task Cancelling_A_Flight_Records_Who_Cancelled_It()
    {
        var pilotId = await RegisterCaptainAndAuthenticateAsync();
        var flightId = await CreateFlightAsync();

        var cancelResponse = await _client.PostAsync($"/Flights/{flightId}/cancel", content: null);
        cancelResponse.EnsureSuccessStatusCode();

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var flight = await context.Flights.AsNoTracking().SingleAsync(f => f.Id == flightId);

        flight.IsCancelled.Should().BeTrue();
        flight.CancelledByPilotId.Should().Be(pilotId);
        flight.CancelledAtUtc.Should().NotBeNull();
    }
}
