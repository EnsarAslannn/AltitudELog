using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using AltitudELog.Application.Auth.Commands.Login;
using AltitudELog.Application.Auth.Commands.Register;
using AltitudELog.Application.Flights.Commands.UpdateFlight;
using AltitudELog.Domain.Enums;
using AltitudELog.Infrastructure.Persistence;
using AltitudELog.IntegrationTests.Infrastructure;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AltitudELog.IntegrationTests.Flights;

[Collection("Integration")]
public class FlightNotFoundTests : IAsyncLifetime
{
    private readonly IntegrationTestWebAppFactory _factory;
    private readonly HttpClient _client;

    public FlightNotFoundTests(IntegrationTestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    public Task InitializeAsync() => _factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<string> RegisterAndLoginAsCaptainAsync()
    {
        var username = $"pilot_captain_{Guid.NewGuid():N}";
        var registerCommand = new RegisterCommand(
            username, "P@ssw0rd123!", "Test Pilot", $"LIC-{Guid.NewGuid():N}", $"{username}@example.com");

        var registerResponse = await _client.PostAsJsonAsync("/Auth/register", registerCommand);
        registerResponse.EnsureSuccessStatusCode();

        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var pilot = await context.Pilots.SingleAsync(p => p.Username == username);
            pilot.Rank = PilotRank.Captain;
            await context.SaveChangesAsync();
        }

        var loginCommand = new LoginCommand(username, "P@ssw0rd123!");
        var loginResponse = await _client.PostAsJsonAsync("/Auth/login", loginCommand);
        loginResponse.EnsureSuccessStatusCode();

        var auth = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        return auth!.Token;
    }

    [Fact]
    public async Task Put_Flights_With_Unknown_Id_Returns_NotFound()
    {
        var token = await RegisterAndLoginAsCaptainAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var unknownId = Guid.NewGuid();
        var command = new UpdateFlightCommand(
            unknownId, "LTFM", "EGLL", TimeSpan.FromHours(2), "A320", DateOnly.FromDateTime(DateTime.UtcNow));

        var response = await _client.PutAsJsonAsync($"/Flights/{unknownId}", command);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Post_Flights_Cancel_With_Unknown_Id_Returns_NotFound()
    {
        var token = await RegisterAndLoginAsCaptainAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var unknownId = Guid.NewGuid();

        var response = await _client.PostAsync($"/Flights/{unknownId}/cancel", null);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
