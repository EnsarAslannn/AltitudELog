using AltitudELog.Application.Common.Caching;
using MediatR;
using Microsoft.Extensions.Caching.Distributed;

namespace AltitudELog.Application.Common.Behaviors;

public class CacheInvalidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IDistributedCache _cache;

    public CacheInvalidationBehavior(IDistributedCache cache)
    {
        _cache = cache;
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
                await _cache.RemoveAsync(key, cancellationToken);
            }
        }

        return response;
    }
}
