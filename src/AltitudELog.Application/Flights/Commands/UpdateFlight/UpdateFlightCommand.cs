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
    public string[] CacheKeysToInvalidate => [CacheKeys.AllFlights, CacheKeys.Stats];
}
