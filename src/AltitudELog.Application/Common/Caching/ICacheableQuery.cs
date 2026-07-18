namespace AltitudELog.Application.Common.Caching;

public interface ICacheableQuery
{
    string CacheKey { get; }
    TimeSpan? Expiry { get; }
}
