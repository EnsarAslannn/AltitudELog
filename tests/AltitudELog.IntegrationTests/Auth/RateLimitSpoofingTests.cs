using System.Net;
using System.Net.Http.Json;
using AltitudELog.Application.Auth.Commands.Login;
using AltitudELog.Application.Auth.Commands.Register;
using AltitudELog.IntegrationTests.Infrastructure;
using AwesomeAssertions;

namespace AltitudELog.IntegrationTests.Auth;

/// <summary>
/// The login limiter partitions on <c>HttpContext.Connection.RemoteIpAddress</c>, which
/// <c>UseForwardedHeaders</c> rewrites from X-Forwarded-For before the limiter runs. A caller who
/// can put an arbitrary value there gets a fresh 5-per-minute bucket on every request, which is
/// the whole brute-force protection gone. <c>ForwardLimit = 1</c> means only the hop appended by
/// the proxy directly in front of the app is honoured, so rotating the client-supplied portion
/// changes nothing.
/// </summary>
[Collection("RateLimitIntegration")]
public class RateLimitSpoofingTests : IAsyncLifetime
{
    private readonly RateLimitTestWebAppFactory _factory;
    private readonly HttpClient _client;

    public RateLimitSpoofingTests(RateLimitTestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();

        _client.DefaultRequestHeaders.Add("X-Test-Client-Ip", "198.51.100.20");
    }

    public Task InitializeAsync() => _factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Rotating_A_Spoofed_XForwardedFor_Does_Not_Reset_The_Login_Limit()
    {
        var username = $"pilot_spoof_{Guid.NewGuid():N}";
        var registerCommand = new RegisterCommand(
            username, "P@ssw0rd123!", "Test Pilot", $"LIC-{Guid.NewGuid():N}", $"{username}@example.com");
        (await _client.PostAsJsonAsync("/Auth/register", registerCommand)).EnsureSuccessStatusCode();

        var loginCommand = new LoginCommand(username, "P@ssw0rd123!");

        for (var attempt = 1; attempt <= 5; attempt++)
        {
            var request = new HttpRequestMessage(HttpMethod.Post, "/Auth/login")
            {
                Content = JsonContent.Create(loginCommand)
            };
            request.Headers.Add("X-Forwarded-For", $"203.0.113.{attempt}");

            var response = await _client.SendAsync(request);
            response.StatusCode.Should().Be(HttpStatusCode.OK, $"attempt {attempt} is within the permit limit");
        }

        var sixthRequest = new HttpRequestMessage(HttpMethod.Post, "/Auth/login")
        {
            Content = JsonContent.Create(loginCommand)
        };
        sixthRequest.Headers.Add("X-Forwarded-For", "203.0.113.99");

        var sixthResponse = await _client.SendAsync(sixthRequest);

        sixthResponse.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
    }
}
