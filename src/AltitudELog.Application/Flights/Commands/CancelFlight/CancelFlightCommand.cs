using AltitudELog.Application.Common.Caching;
using MediatR;

namespace AltitudELog.Application.Flights.Commands.CancelFlight;

public record CancelFlightCommand(Guid FlightId) : IRequest, ICacheInvalidatorCommand
{
    public string[] CacheKeysToInvalidate => [CacheKeys.AllFlights, CacheKeys.Stats];
}
