using AltitudELog.Application.Common.Caching;
using MediatR;

namespace AltitudELog.Application.Crew.Queries.GetCrewByFlight;

public record GetCrewByFlightQuery(Guid FlightId) : IRequest<List<CrewDto>>, ICacheableQuery
{
    public string CacheKey => CacheKeys.CrewByFlight(FlightId);
    public TimeSpan? Expiry => TimeSpan.FromMinutes(5);
}
