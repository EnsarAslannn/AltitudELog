using System.Text.Json.Serialization;
using AltitudELog.Application.Common.Caching;
using MediatR;

namespace AltitudELog.Application.Flights.Commands.UpdateFlight;

public record UpdateFlightCommand(
    Guid FlightId,
    string OriginICAO,
    string DestinationICAO,
    TimeSpan FlightTime,
    string AircraftType,
    DateOnly Date
) : IRequest, ICacheInvalidatorCommand
{
    // Settable because the handler appends `pilot:profile:{id}` for each crewed pilot after
    // SaveChangesAsync (those ids aren't knowable from the command's own fields). [JsonIgnore]
    // keeps it out of model binding: FlightsController binds this command straight from the
    // request body, so without it a caller could name arbitrary Redis keys to evict.
    [JsonIgnore]
    public string[] CacheKeysToInvalidate { get; set; } = [CacheKeys.Stats];
}
