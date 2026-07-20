using System.Text.Json;
using AltitudELog.Application.Common.Caching;
using MediatR;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Common.Behaviors;

public class CachingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IDistributedCache _cache;
    private readonly ILogger<CachingBehavior<TRequest, TResponse>> _logger;

    public CachingBehavior(IDistributedCache cache, ILogger<CachingBehavior<TRequest, TResponse>> logger)
    {
        _cache = cache;
        _logger = logger;
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

        string? cached = null;
        try
        {
            cached = await _cache.GetStringAsync(cacheable.CacheKey, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex, "Failed to read cache key {CacheKey}; falling back to source.", cacheable.CacheKey);
        }

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

        try
        {
            await _cache.SetStringAsync(
                cacheable.CacheKey,
                JsonSerializer.Serialize(response, CacheSerializerOptions.Instance),
                options,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to write cache key {CacheKey}; continuing without cache.", cacheable.CacheKey);
        }

        return response;
    }
}
