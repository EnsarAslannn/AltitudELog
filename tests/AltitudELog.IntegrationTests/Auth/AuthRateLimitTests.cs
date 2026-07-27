using System.Net;
using System.Net.Http.Json;
using AltitudELog.Application.Auth.Commands.Register;
using AltitudELog.IntegrationTests.Infrastructure;
using AwesomeAssertions;

namespace AltitudELog.IntegrationTests.Auth;

[Collection("AuthRateLimitIntegration")]
public class AuthRateLimitTests : IAsyncLifetime
{
    private readonly AuthRateLimitTestWebAppFactory _factory;
    private readonly HttpClient _client;

    public AuthRateLimitTests(AuthRateLimitTestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    public Task InitializeAsync() => _factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Register_Beyond_Permit_Limit_Returns_TooManyRequests()
    {
        for (var attempt = 1; attempt <= 10; attempt++)
        {
            var username = $"pilot_authratelimit_{Guid.NewGuid():N}";
            var command = new RegisterCommand(
                username, "P@ssw0rd123!", "Test Pilot", $"LIC-{Guid.NewGuid():N}", $"{username}@example.com");

            var response = await _client.PostAsJsonAsync("/Auth/register", command);
            response.StatusCode.Should().Be(HttpStatusCode.OK, $"attempt {attempt} is within the permit limit");
        }

        var eleventhUsername = $"pilot_authratelimit_{Guid.NewGuid():N}";
        var eleventhCommand = new RegisterCommand(
            eleventhUsername, "P@ssw0rd123!", "Test Pilot", $"LIC-{Guid.NewGuid():N}", $"{eleventhUsername}@example.com");
        var eleventhResponse = await _client.PostAsJsonAsync("/Auth/register", eleventhCommand);

        eleventhResponse.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
    }
}
