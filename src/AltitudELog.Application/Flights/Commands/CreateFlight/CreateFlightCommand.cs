using AltitudELog.Application.Common.Caching;
using MediatR;

namespace AltitudELog.Application.Flights.Commands.CreateFlight;

public record CreateFlightCommand(
    string OriginICAO,
    string DestinationICAO,
    TimeSpan FlightTime,
    string AircraftType,
    DateOnly Date,
    string? METARInfo
) : IRequest<Guid>, ICacheInvalidatorCommand
{
    public string[] CacheKeysToInvalidate => [CacheKeys.AllFlights, CacheKeys.Stats];
}
