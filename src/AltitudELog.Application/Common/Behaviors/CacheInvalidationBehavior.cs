using AltitudELog.Application.Common.Caching;
using MediatR;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Common.Behaviors;

public class CacheInvalidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IDistributedCache _cache;
    private readonly ILogger<CacheInvalidationBehavior<TRequest, TResponse>> _logger;

    public CacheInvalidationBehavior(
        IDistributedCache cache,
        ILogger<CacheInvalidationBehavior<TRequest, TResponse>> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var response = await next();

        if (request is ICacheInvalidatorCommand invalidator)
        {
            foreach (var key in invalidator.CacheKeysToInvalidate)
            {
                try
                {
                    await _cache.RemoveAsync(key, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(
                        ex, "Failed to invalidate cache key {CacheKey}; continuing without cache.", key);
                }
            }
        }

        return response;
    }
}
