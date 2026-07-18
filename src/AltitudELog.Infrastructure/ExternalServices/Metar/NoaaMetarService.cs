using System.Text.Json;
using System.Text.Json.Serialization;
using AltitudELog.Application.Common.Interfaces;

namespace AltitudELog.Infrastructure.ExternalServices.Metar;

public class NoaaMetarService : IMetarService
{
    private readonly HttpClient _httpClient;

    public NoaaMetarService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<string?> GetRawMetarAsync(string icaoCode, CancellationToken cancellationToken)
    {
        var response = await _httpClient.GetAsync(
            $"api/data/metar?ids={Uri.EscapeDataString(icaoCode)}&format=json",
            cancellationToken);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(body))
        {
            return null;
        }

        var observations = JsonSerializer.Deserialize<List<NoaaMetarObservation>>(body);
        return observations?.FirstOrDefault()?.RawOb;
    }

    private class NoaaMetarObservation
    {
        [JsonPropertyName("rawOb")]
        public string? RawOb { get; set; }
    }
}
