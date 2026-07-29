using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using AltitudELog.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Infrastructure.ExternalServices.Metar;

public class NoaaMetarService : IMetarService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<NoaaMetarService> _logger;

    public NoaaMetarService(HttpClient httpClient, ILogger<NoaaMetarService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<string?> GetRawMetarAsync(string icaoCode, CancellationToken cancellationToken)
    {
        var response = await _httpClient.GetAsync(
            $"api/data/metar?ids={Uri.EscapeDataString(icaoCode)}&format=json",
            cancellationToken);

        // "No observation for this airport" is a normal outcome, not a failure. Letting a 404
        // throw meant UpdateFlightMetarJob burned all three retries and then sat in the Hangfire
        // dashboard as Failed, even though the job already handles a null perfectly well.
        // 5xx and 429 still throw, because those are worth retrying.
        if (response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.NoContent)
        {
            _logger.LogInformation(
                "NOAA returned {StatusCode} for {IcaoCode}; treating as no observation available",
                (int)response.StatusCode, icaoCode);
            return null;
        }

        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(body))
        {
            return null;
        }

        try
        {
            var observations = JsonSerializer.Deserialize<List<NoaaMetarObservation>>(body);
            return observations?.FirstOrDefault()?.RawOb;
        }
        catch (JsonException ex)
        {
            // A 200 carrying an HTML error page or an unexpected object shape is the upstream
            // misbehaving, not something a retry fixes. Swallow it so the enrichment is simply
            // skipped: METAR is a nice-to-have on a flight record, and a malformed upstream
            // response must not leave a permanently Failed job behind.
            _logger.LogWarning(
                ex, "NOAA returned an unparseable METAR payload for {IcaoCode}", icaoCode);
            return null;
        }
    }

    private class NoaaMetarObservation
    {
        [JsonPropertyName("rawOb")]
        public string? RawOb { get; set; }
    }
}
