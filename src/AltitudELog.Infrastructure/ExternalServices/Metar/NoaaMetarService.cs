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
