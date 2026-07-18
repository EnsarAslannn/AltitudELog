using AltitudELog.Application.Common.Caching;
using MediatR;

namespace AltitudELog.Application.Flights.Queries.GetFlights;

public record GetFlightsQuery : IRequest<List<FlightDto>>, ICacheableQuery
{
    public string CacheKey => CacheKeys.AllFlights;
    public TimeSpan? Expiry => TimeSpan.FromMinutes(5);
}
