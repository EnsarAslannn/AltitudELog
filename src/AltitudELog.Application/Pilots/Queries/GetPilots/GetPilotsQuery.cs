using AltitudELog.Application.Common.Caching;
using MediatR;

namespace AltitudELog.Application.Pilots.Queries.GetPilots;

public record GetPilotsQuery : IRequest<List<PilotDto>>, ICacheableQuery
{
    public string CacheKey => CacheKeys.AllPilots;
    public TimeSpan? Expiry => TimeSpan.FromMinutes(5);
}
