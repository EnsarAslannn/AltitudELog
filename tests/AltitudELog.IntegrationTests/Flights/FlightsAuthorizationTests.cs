using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using AltitudELog.Application.Auth.Commands.Login;
using AltitudELog.Application.Auth.Commands.Register;
using AltitudELog.Application.Flights.Commands.CreateFlight;
using AltitudELog.Domain.Enums;
using AltitudELog.Infrastructure.Persistence;
using AltitudELog.IntegrationTests.Infrastructure;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AltitudELog.IntegrationTests.Flights;

[Collection("Integration")]
public class FlightsAuthorizationTests : IAsyncLifetime
{
    private readonly IntegrationTestWebAppFactory _factory;
    private readonly HttpClient _client;

    public FlightsAuthorizationTests(IntegrationTestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    public Task InitializeAsync() => _factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<string> RegisterAndLoginAsync(PilotRank rank, string usernameSuffix)
    {
        var username = $"pilot_{usernameSuffix}_{Guid.NewGuid():N}";
        var registerCommand = new RegisterCommand(
            username, "P@ssw0rd123!", "Test Pilot", $"LIC-{Guid.NewGuid():N}", $"{username}@example.com");

        var registerResponse = await _client.PostAsJsonAsync("/Auth/register", registerCommand);
        registerResponse.EnsureSuccessStatusCode();

        if (rank != PilotRank.Trainee)
        {
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var pilot = await context.Pilots.SingleAsync(p => p.Username == username);
            pilot.Rank = rank;
            await context.SaveChangesAsync();
        }

        var loginCommand = new LoginCommand(username, "P@ssw0rd123!");
        var loginResponse = await _client.PostAsJsonAsync("/Auth/login", loginCommand);
        loginResponse.EnsureSuccessStatusCode();

        var auth = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        return auth!.Token;
    }

    private static CreateFlightCommand ValidCommand() => new(
        OriginICAO: "LTFM",
        DestinationICAO: "EGLL",
        FlightTime: TimeSpan.FromHours(4),
        AircraftType: "A350",
        Date: DateOnly.FromDateTime(DateTime.UtcNow),
        METARInfo: null);

    [Fact]
    public async Task Get_Flights_Without_Token_Returns_Unauthorized()
    {
        var response = await _client.GetAsync("/Flights");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Get_Flights_With_Token_Returns_Ok()
    {
        var token = await RegisterAndLoginAsync(PilotRank.Trainee, "reader");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/Flights");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Get_Flight_By_Id_Without_Token_Returns_Unauthorized()
    {
        var response = await _client.GetAsync($"/Flights/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Get_Flight_By_Id_With_Token_Returns_Ok()
    {
        var captainToken = await RegisterAndLoginAsync(PilotRank.Captain, "captain");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", captainToken);

        var createResponse = await _client.PostAsJsonAsync("/Flights", ValidCommand());
        createResponse.EnsureSuccessStatusCode();
        var flightId = await createResponse.Content.ReadFromJsonAsync<Guid>();

        var response = await _client.GetAsync($"/Flights/{flightId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
