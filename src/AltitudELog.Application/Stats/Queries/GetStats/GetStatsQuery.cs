using AltitudELog.Application.Common.Caching;
using MediatR;

namespace AltitudELog.Application.Stats.Queries.GetStats;

public record GetStatsQuery : IRequest<StatsDto>, ICacheableQuery
{
    public string CacheKey => CacheKeys.Stats;
    public TimeSpan? Expiry => TimeSpan.FromMinutes(5);
}
