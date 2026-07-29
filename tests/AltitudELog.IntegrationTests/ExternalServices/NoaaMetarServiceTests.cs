using System.Net;
using System.Text;
using AltitudELog.Infrastructure.ExternalServices.Metar;
using AwesomeAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace AltitudELog.IntegrationTests.ExternalServices;

/// <summary>
/// No database or container needed — the HTTP handler is stubbed — but it lives here rather than
/// in the unit-test project because NoaaMetarService is in Infrastructure, which
/// AltitudELog.Application.UnitTests deliberately does not reference.
///
/// The point of these is that METAR enrichment is a nice-to-have on a flight record. An upstream
/// hiccup must degrade to "no METAR yet", never to a permanently Failed Hangfire job that someone
/// has to go and clear by hand.
/// </summary>
public class NoaaMetarServiceTests
{
    private static NoaaMetarService CreateService(HttpStatusCode statusCode, string body)
    {
        var handler = new StubHandler(statusCode, body);
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://aviationweather.gov/") };

        return new NoaaMetarService(httpClient, NullLogger<NoaaMetarService>.Instance);
    }

    [Fact]
    public async Task Returns_The_Raw_Observation_On_Success()
    {
        var service = CreateService(
            HttpStatusCode.OK,
            """[{"rawOb":"LTFM 121350Z 30012KT CAVOK 24/09 Q1014"}]""");

        var metar = await service.GetRawMetarAsync("LTFM", CancellationToken.None);

        metar.Should().Be("LTFM 121350Z 30012KT CAVOK 24/09 Q1014");
    }

    [Theory]
    [InlineData(HttpStatusCode.NotFound)]
    [InlineData(HttpStatusCode.NoContent)]
    public async Task Returns_Null_Rather_Than_Throwing_When_There_Is_No_Observation(HttpStatusCode statusCode)
    {
        // An unknown or unreported ICAO used to throw, exhaust all three retries, and leave the
        // job Failed in the dashboard.
        var service = CreateService(statusCode, "");

        var metar = await service.GetRawMetarAsync("ZZZZ", CancellationToken.None);

        metar.Should().BeNull();
    }

    [Fact]
    public async Task Returns_Null_For_An_Empty_Array()
    {
        var service = CreateService(HttpStatusCode.OK, "[]");

        var metar = await service.GetRawMetarAsync("LTFM", CancellationToken.None);

        metar.Should().BeNull();
    }

    [Theory]
    [InlineData("<html><body>502 Bad Gateway</body></html>")]
    [InlineData("""{"error":"unexpected shape"}""")]
    public async Task Returns_Null_For_An_Unparseable_200(string body)
    {
        // A 200 carrying HTML or an object instead of an array is the upstream misbehaving;
        // retrying will not fix it, so the enrichment is skipped instead of failing the job.
        var service = CreateService(HttpStatusCode.OK, body);

        var metar = await service.GetRawMetarAsync("LTFM", CancellationToken.None);

        metar.Should().BeNull();
    }

    [Theory]
    [InlineData(HttpStatusCode.InternalServerError)]
    [InlineData(HttpStatusCode.TooManyRequests)]
    public async Task Still_Throws_On_Statuses_Worth_Retrying(HttpStatusCode statusCode)
    {
        // These are transient, so Hangfire's retry should get its chance — swallowing them would
        // silently drop METAR for flights that would have succeeded a minute later.
        var service = CreateService(statusCode, "");

        var act = () => service.GetRawMetarAsync("LTFM", CancellationToken.None);

        await act.Should().ThrowAsync<HttpRequestException>();
    }

    private sealed class StubHandler : HttpMessageHandler
    {
        private readonly HttpStatusCode _statusCode;
        private readonly string _body;

        public StubHandler(HttpStatusCode statusCode, string body)
        {
            _statusCode = statusCode;
            _body = body;
        }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(_statusCode)
            {
                Content = new StringContent(_body, Encoding.UTF8, "application/json")
            });
    }
}
