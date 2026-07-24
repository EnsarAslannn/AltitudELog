using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using AltitudELog.Application.Auth.Commands.Login;
using AltitudELog.Application.Auth.Commands.Register;
using AltitudELog.Application.Flights.Commands.CreateFlight;
using AltitudELog.Application.Flights.Jobs;
using AltitudELog.Domain.Enums;
using AltitudELog.Infrastructure.Persistence;
using AltitudELog.IntegrationTests.Infrastructure;
using AwesomeAssertions;
using Hangfire;
using Hangfire.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;

namespace AltitudELog.IntegrationTests.Flights;

[Collection("Integration")]
public class CreateFlightHappyPathTests : IAsyncLifetime
{
    private readonly IntegrationTestWebAppFactory _factory;
    private readonly HttpClient _client;

    public CreateFlightHappyPathTests(IntegrationTestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    public Task InitializeAsync()
    {
        // _factory.BackgroundJobClient is a substitute shared for the whole "Integration"
        // collection fixture (see IntegrationTestWebAppFactory), so calls recorded by other test
        // classes that also POST /Flights (e.g. FlightsAuthorizationTests, LogbookCsvExportTests)
        // would otherwise leak into this class's ReceivedCalls()/SingleOrDefault assertions.
        _factory.BackgroundJobClient.ClearReceivedCalls();
        return _factory.ResetDatabaseAsync();
    }

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
    public async Task Post_Flights_As_Captain_Creates_Flight_And_Enqueues_Metar_Job()
    {
        var token = await RegisterAndLoginAsync(PilotRank.Captain, "captain");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.PostAsJsonAsync("/Flights", ValidCommand());

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var flightId = await response.Content.ReadFromJsonAsync<Guid>();
        flightId.Should().NotBe(Guid.Empty);

        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var stored = await context.Flights.SingleAsync(f => f.Id == flightId);
            stored.OriginICAO.Should().Be("LTFM");
        }

        var createCall = _factory.BackgroundJobClient.ReceivedCalls()
            .SingleOrDefault(call => call.GetMethodInfo().Name == nameof(IBackgroundJobClient.Create));

        createCall.Should().NotBeNull("the FlightCreatedEventHandler should have enqueued a METAR job");

        var enqueuedJob = (Job)createCall!.GetArguments()[0]!;
        enqueuedJob.Type.Should().Be(typeof(UpdateFlightMetarJob));
        enqueuedJob.Method.Name.Should().Be(nameof(UpdateFlightMetarJob.ExecuteAsync));
        enqueuedJob.Args[0].Should().Be(flightId);
        enqueuedJob.Args[1].Should().Be("LTFM");
    }

    [Fact]
    public async Task Post_Flights_As_NonCaptain_Returns_Forbidden()
    {
        var token = await RegisterAndLoginAsync(PilotRank.FirstOfficer, "fo");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.PostAsJsonAsync("/Flights", ValidCommand());

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
