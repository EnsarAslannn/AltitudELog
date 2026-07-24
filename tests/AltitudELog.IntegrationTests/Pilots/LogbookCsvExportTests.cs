using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using AltitudELog.Application.Auth.Commands.Login;
using AltitudELog.Application.Auth.Commands.Register;
using AltitudELog.Application.Crew.Commands.CreateCrew;
using AltitudELog.Application.Flights.Commands.CreateFlight;
using AltitudELog.Domain.Enums;
using AltitudELog.Infrastructure.Persistence;
using AltitudELog.IntegrationTests.Infrastructure;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AltitudELog.IntegrationTests.Pilots;

// Covers the CSV formula-injection fix in AltitudELog.API.Common.Export.CsvLogbookWriter: a cell
// value starting with =, +, -, or @ must be prefixed with a leading apostrophe so spreadsheet
// apps (Excel, Sheets) read it as literal text instead of executing it as a formula. This lives
// in AltitudELog.API (not Application), so it's exercised here at the HTTP level rather than as
// an Application-layer unit test.
[Collection("Integration")]
public class LogbookCsvExportTests : IAsyncLifetime
{
    private readonly IntegrationTestWebAppFactory _factory;
    private readonly HttpClient _client;

    public LogbookCsvExportTests(IntegrationTestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    public Task InitializeAsync() => _factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Get_Logbook_Csv_Escapes_AircraftType_Starting_With_Formula_Trigger_Char()
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

        var loginResponse = await _client.PostAsJsonAsync("/Auth/login", new LoginCommand(username, "P@ssw0rd123!"));
        loginResponse.EnsureSuccessStatusCode();
        var auth = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);

        var maliciousAircraftType = "=cmd|'/c calc'!A1";
        var createFlightResponse = await _client.PostAsJsonAsync("/Flights", new CreateFlightCommand(
            OriginICAO: "LTFM",
            DestinationICAO: "EGLL",
            FlightTime: TimeSpan.FromHours(4),
            AircraftType: maliciousAircraftType,
            Date: DateOnly.FromDateTime(DateTime.UtcNow),
            METARInfo: null));
        createFlightResponse.EnsureSuccessStatusCode();
        var flightId = await createFlightResponse.Content.ReadFromJsonAsync<Guid>();

        var createCrewResponse = await _client.PostAsJsonAsync(
            "/Crew", new CreateCrewCommand(flightId, auth.PilotId, DutyRole.PIC));
        createCrewResponse.EnsureSuccessStatusCode();

        var csvResponse = await _client.GetAsync($"/Pilots/{auth.PilotId}/logbook?format=csv");
        csvResponse.EnsureSuccessStatusCode();

        var csvBytes = await csvResponse.Content.ReadAsByteArrayAsync();
        var csv = Encoding.UTF8.GetString(csvBytes);

        csv.Should().Contain($"'{maliciousAircraftType}");
        csv.Should().NotContain($",{maliciousAircraftType},");
    }
}
