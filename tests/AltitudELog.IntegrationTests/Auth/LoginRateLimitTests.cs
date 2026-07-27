using System.Net;
using System.Net.Http.Json;
using AltitudELog.Application.Auth.Commands.Login;
using AltitudELog.Application.Auth.Commands.Register;
using AltitudELog.IntegrationTests.Infrastructure;
using AwesomeAssertions;

namespace AltitudELog.IntegrationTests.Auth;

[Collection("RateLimitIntegration")]
public class LoginRateLimitTests : IAsyncLifetime
{
    private readonly RateLimitTestWebAppFactory _factory;
    private readonly HttpClient _client;

    public LoginRateLimitTests(RateLimitTestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    public Task InitializeAsync() => _factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Login_Beyond_Permit_Limit_Returns_TooManyRequests()
    {
        var username = $"pilot_ratelimit_{Guid.NewGuid():N}";
        var registerCommand = new RegisterCommand(
            username, "P@ssw0rd123!", "Test Pilot", $"LIC-{Guid.NewGuid():N}", $"{username}@example.com");
        var registerResponse = await _client.PostAsJsonAsync("/Auth/register", registerCommand);
        registerResponse.EnsureSuccessStatusCode();

        var loginCommand = new LoginCommand(username, "P@ssw0rd123!");

        for (var attempt = 1; attempt <= 5; attempt++)
        {
            var response = await _client.PostAsJsonAsync("/Auth/login", loginCommand);
            response.StatusCode.Should().Be(HttpStatusCode.OK, $"attempt {attempt} is within the permit limit");
        }

        var sixthResponse = await _client.PostAsJsonAsync("/Auth/login", loginCommand);

        sixthResponse.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
    }
}
