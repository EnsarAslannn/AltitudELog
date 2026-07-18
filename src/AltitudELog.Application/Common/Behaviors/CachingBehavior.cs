using System.Text.Json;
using AltitudELog.Application.Common.Caching;
using MediatR;
using Microsoft.Extensions.Caching.Distributed;

namespace AltitudELog.Application.Common.Behaviors;

public class CachingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IDistributedCache _cache;

    public CachingBehavior(IDistributedCache cache)
    {
        _cache = cache;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (request is not ICacheableQuery cacheable)
        {
            return await next();
        }

        var cached = await _cache.GetStringAsync(cacheable.CacheKey, cancellationToken);
        if (cached is not null)
        {
            return JsonSerializer.Deserialize<TResponse>(cached, CacheSerializerOptions.Instance)!;
        }

        var response = await next();

        var options = new DistributedCacheEntryOptions();
        if (cacheable.Expiry.HasValue)
        {
            options.SetAbsoluteExpiration(cacheable.Expiry.Value);
        }

        await _cache.SetStringAsync(
            cacheable.CacheKey,
            JsonSerializer.Serialize(response, CacheSerializerOptions.Instance),
            options,
            cancellationToken);

        return response;
    }
}
