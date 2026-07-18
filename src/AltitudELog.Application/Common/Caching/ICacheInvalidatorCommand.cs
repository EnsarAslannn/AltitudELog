namespace AltitudELog.Application.Common.Caching;

public interface ICacheInvalidatorCommand
{
    string[] CacheKeysToInvalidate { get; }
}
