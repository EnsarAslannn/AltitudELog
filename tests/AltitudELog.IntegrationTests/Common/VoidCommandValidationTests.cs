using System.Net;
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
/// End-to-end guard for the pipeline-behavior generic constraint (see
/// PipelineBehaviorRegistrationTests in the unit-test project for the mechanism).
///
/// Void commands — those implementing MediatR's non-generic <c>IRequest</c> — used to resolve zero
/// pipeline behaviors, so <c>PUT /Flights/{id}</c> accepted a 3-letter ICAO and a future date with
/// a cheerful 204. The unit tests for UpdateFlightCommandValidator passed the whole time because
/// they construct the validator directly; only an HTTP-level test proves the rule is enforced.
/// </summary>
[Collection("Integration")]
public class VoidCommandValidationTests : IAsyncLifetime
{
    private readonly IntegrationTestWebAppFactory _factory;
    private readonly HttpClient _client;

    public VoidCommandValidationTests(IntegrationTestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    public Task InitializeAsync() => _factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task AuthenticateAsCaptainAsync()
    {
        var username = $"pilot_captain_{Guid.NewGuid():N}";
        var registerCommand = new RegisterCommand(
            username, "P@ssw0rd123!", "Test Pilot", $"LIC-{Guid.NewGuid():N}", $"{username}@example.com");

        (await _client.PostAsJsonAsync("/Auth/register", registerCommand)).EnsureSuccessStatusCode();

        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var pilot = await context.Pilots.SingleAsync(p => p.Username == username);
            pilot.Rank = PilotRank.Captain;
            await context.SaveChangesAsync();
        }

        var loginResponse = await _client.PostAsJsonAsync(
            "/Auth/login", new LoginCommand(username, "P@ssw0rd123!"));
        loginResponse.EnsureSuccessStatusCode();

        var auth = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
    }

    private async Task<Guid> CreateFlightAsync()
    {
        var command = new CreateFlightCommand(
            "LTFM", "EGLL", TimeSpan.FromHours(2), "A320", DateOnly.FromDateTime(DateTime.UtcNow));

        var response = await _client.PostAsJsonAsync("/Flights", command);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<Guid>();
    }

    [Fact]
    public async Task Put_Flights_With_Invalid_Icao_Returns_BadRequest()
    {
        await AuthenticateAsCaptainAsync();
        var flightId = await CreateFlightAsync();

        var command = new UpdateFlightCommand(
            flightId, "IST", "EGLL", TimeSpan.FromHours(2), "A320", DateOnly.FromDateTime(DateTime.UtcNow));

        var response = await _client.PutAsJsonAsync($"/Flights/{flightId}", command);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Put_Flights_With_Future_Date_Returns_BadRequest()
    {
        await AuthenticateAsCaptainAsync();
        var flightId = await CreateFlightAsync();

        var command = new UpdateFlightCommand(
            flightId, "LTFM", "EGLL", TimeSpan.FromHours(2), "A320",
            DateOnly.FromDateTime(DateTime.UtcNow).AddDays(30));

        var response = await _client.PutAsJsonAsync($"/Flights/{flightId}", command);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Put_Flights_With_Zero_FlightTime_Returns_BadRequest()
    {
        await AuthenticateAsCaptainAsync();
        var flightId = await CreateFlightAsync();

        var command = new UpdateFlightCommand(
            flightId, "LTFM", "EGLL", TimeSpan.Zero, "A320", DateOnly.FromDateTime(DateTime.UtcNow));

        var response = await _client.PutAsJsonAsync($"/Flights/{flightId}", command);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Post_ResetPassword_With_Too_Short_Password_Returns_BadRequest()
    {
        var response = await _client.PostAsJsonAsync(
            "/Auth/reset-password", new { token = "irrelevant-token", newPassword = "abc" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
