using AltitudELog.Application.Common.Caching;
using MediatR;

namespace AltitudELog.Application.Pilots.Queries.GetPilotProfile;

public record GetPilotProfileQuery(Guid PilotId) : IRequest<PilotProfileDto?>, ICacheableQuery
{
    public string CacheKey => CacheKeys.PilotProfile(PilotId);
    public TimeSpan? Expiry => TimeSpan.FromMinutes(5);
}
