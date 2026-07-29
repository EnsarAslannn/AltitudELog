using System.Text.Json.Serialization;
using AltitudELog.Application.Common.Caching;
using MediatR;

namespace AltitudELog.Application.Flights.Commands.CancelFlight;

public record CancelFlightCommand(Guid FlightId) : IRequest, ICacheInvalidatorCommand
{
    // See UpdateFlightCommand: settable so the handler can append the crewed pilots' profile keys.
    // This command is built from the route rather than the body, but the attribute stays as a
    // guard in case it ever gains a bound payload.
    [JsonIgnore]
    public string[] CacheKeysToInvalidate { get; set; } = [CacheKeys.Stats];
}
