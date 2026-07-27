using AltitudELog.Application.Common.Caching;
using MediatR;

namespace AltitudELog.Application.Flights.Commands.CreateFlight;

public record CreateFlightCommand(
    string OriginICAO,
    string DestinationICAO,
    TimeSpan FlightTime,
    string AircraftType,
    DateOnly Date
) : IRequest<Guid>, ICacheInvalidatorCommand
{
    public string[] CacheKeysToInvalidate => [CacheKeys.Stats];
}
