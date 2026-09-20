using System.Net;
using System.Net.Http.Json;
using AltitudELog.API.Common;
using AltitudELog.Application;
using AltitudELog.Application.Chat;
using AwesomeAssertions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace AltitudELog.IntegrationTests.Chat;

public class ChatEndpointTests : IDisposable
{
    private readonly IHost _host;
    private readonly HttpClient _client;

    public ChatEndpointTests()
    {
        _host = new HostBuilder()
            .ConfigureWebHost(webHost => webHost
                .UseTestServer()
                .ConfigureAppConfiguration(configuration => configuration.AddInMemoryCollection(
                    new Dictionary<string, string?>
                    {
                        ["Cors:AllowedOrigins:0"] = "http://localhost:5180"
                    }))
                .ConfigureServices((context, services) =>
                {
                    services.AddControllers().AddApplicationPart(typeof(Program).Assembly);
                    services.AddApplicationServices();
                    services.AddFrontendCors(context.Configuration);
                })
                .Configure(app =>
                {
                    app.UseRouting();
                    app.UseCors(FrontendCors.PolicyName);
                    app.UseEndpoints(endpoints => endpoints.MapControllers());
                }))
            .Start();

        _client = _host.GetTestClient();
    }

    [Fact]
    public async Task Post_Chat_Without_Authentication_Returns_The_Static_Response_Contract()
    {
        var request = new ChatRequest(
            "METAR nasıl çalışır?",
            "tr",
            [new ChatHistoryMessage("user", "Uçuş kaydı hakkında bilgi ver")]);

        var response = await _client.PostAsJsonAsync("/api/chat", request);
        var body = await response.Content.ReadFromJsonAsync<ChatResponse>();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().NotBeNull();
        body!.Answer.Should().NotBeNullOrWhiteSpace();
        body.Sources.Should().NotBeEmpty();
        body.Suggestions.Should().HaveCountLessThanOrEqualTo(3);
        body.UsedAi.Should().BeFalse();
    }

    [Fact]
    public async Task Post_Chat_With_A_Blank_Message_Returns_ValidationProblem()
    {
        var response = await _client.PostAsJsonAsync("/api/chat", new ChatRequest("   ", "tr", []));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Theory]
    [InlineData("http://localhost:5180", true)]
    [InlineData("https://untrusted.example", false)]
    public async Task Cors_Preflight_Only_Reflects_Explicitly_Allowed_Origins(string origin, bool shouldAllow)
    {
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/chat");
        request.Headers.Add("Origin", origin);
        request.Headers.Add("Access-Control-Request-Method", "POST");

        var response = await _client.SendAsync(request);
        var hasAllowOrigin = response.Headers.TryGetValues("Access-Control-Allow-Origin", out var values);

        hasAllowOrigin.Should().Be(shouldAllow);
        if (shouldAllow)
        {
            values.Should().ContainSingle(origin);
        }
    }

    public void Dispose()
    {
        _client.Dispose();
        _host.Dispose();
    }
}
