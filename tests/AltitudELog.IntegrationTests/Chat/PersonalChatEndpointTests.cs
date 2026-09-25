using System.Net.Http.Headers;
using System.Net.Http.Json;
using AltitudELog.Application.Auth.Commands.Login;
using AltitudELog.Application.Auth.Commands.Register;
using AltitudELog.Application.Chat;
using AltitudELog.IntegrationTests.Infrastructure;
using AwesomeAssertions;

namespace AltitudELog.IntegrationTests.Chat;

[Collection("Integration")]
public class PersonalChatEndpointTests : IAsyncLifetime
{
    private readonly IntegrationTestWebAppFactory _factory;
    private readonly HttpClient _client;

    public PersonalChatEndpointTests(IntegrationTestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    public Task InitializeAsync() => _factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Post_PersonalChat_As_Authenticated_Pilot_Returns_Personal_Answer()
    {
        var username = $"chat_{Guid.NewGuid():N}";
        var password = "P@ssw0rd123!";
        var registration = new RegisterCommand(
            username,
            password,
            "Chat Pilot",
            $"LIC-{Guid.NewGuid():N}",
            $"{username}@example.com");
        (await _client.PostAsJsonAsync("/Auth/register", registration)).EnsureSuccessStatusCode();
        var loginResponse = await _client.PostAsJsonAsync("/Auth/login", new LoginCommand(username, password));
        loginResponse.EnsureSuccessStatusCode();
        var auth = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);

        var response = await _client.PostAsJsonAsync(
            "/api/chat/personal",
            new ChatRequest("Bu ay kaç saat uçtum?", "tr", []));
        var result = await response.Content.ReadFromJsonAsync<ChatResponse>();

        response.EnsureSuccessStatusCode();
        result.Should().NotBeNull();
        result!.Answer.Should().Contain("0 saat");
        result.Sources.Should().ContainSingle(source => source.Url == $"/pilots/{auth.PilotId}");
    }
}
