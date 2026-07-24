using System.Text;
using System.Text.Json;
using AltitudELog.Application.Common.Behaviors;
using AltitudELog.Application.Common.Caching;
using AwesomeAssertions;
using MediatR;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace AltitudELog.Application.UnitTests.Common.Behaviors;

public class CachingBehaviorTests
{
    // Public (not private/nested-private) because CachingBehavior<TRequest,TResponse> depends on
    // ILogger<CachingBehavior<TRequest,TResponse>>, and NSubstitute/Castle DynamicProxy needs to
    // generate a proxy over that closed generic type — which requires TRequest to be an accessible
    // (public) type, not a private nested class.
    public record CacheableTestQuery(string Key) : IRequest<string>, ICacheableQuery
    {
        public string CacheKey => Key;
        public TimeSpan? Expiry => TimeSpan.FromMinutes(5);
    }

    public record NonCacheableTestQuery : IRequest<string>;

    private static CachingBehavior<TRequest, string> CreateBehavior<TRequest>(IDistributedCache cache)
        where TRequest : IRequest<string> =>
        new(cache, Substitute.For<ILogger<CachingBehavior<TRequest, string>>>());

    [Fact]
    public async Task Handle_Should_Return_Cached_Value_Without_Calling_Next_On_Cache_Hit()
    {
        var cache = Substitute.For<IDistributedCache>();
        var cachedJson = JsonSerializer.Serialize("cached-value");
        cache.GetAsync("some-key", Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<byte[]?>(Encoding.UTF8.GetBytes(cachedJson)));

        var behavior = CreateBehavior<CacheableTestQuery>(cache);

        var nextCalled = false;
        Task<string> Next()
        {
            nextCalled = true;
            return Task.FromResult("fresh-value");
        }

        var result = await behavior.Handle(new CacheableTestQuery("some-key"), Next, CancellationToken.None);

        result.Should().Be("cached-value");
        nextCalled.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_Should_Call_Next_And_Write_Cache_On_Cache_Miss()
    {
        var cache = Substitute.For<IDistributedCache>();
        cache.GetAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<byte[]?>(null));

        var behavior = CreateBehavior<CacheableTestQuery>(cache);

        var result = await behavior.Handle(
            new CacheableTestQuery("some-key"), () => Task.FromResult("fresh-value"), CancellationToken.None);

        result.Should().Be("fresh-value");

        var expectedJson = JsonSerializer.Serialize("fresh-value");
        await cache.Received(1).SetAsync(
            "some-key",
            Arg.Is<byte[]>(bytes => Encoding.UTF8.GetString(bytes!) == expectedJson),
            Arg.Any<DistributedCacheEntryOptions>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_Should_Fall_Through_To_Next_When_Cache_Read_Throws()
    {
        var cache = Substitute.For<IDistributedCache>();
        cache.GetAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Throws(new Exception("Redis unreachable"));

        var behavior = CreateBehavior<CacheableTestQuery>(cache);

        var result = await behavior.Handle(
            new CacheableTestQuery("some-key"), () => Task.FromResult("fresh-value"), CancellationToken.None);

        result.Should().Be("fresh-value");
    }

    [Fact]
    public async Task Handle_Should_Not_Throw_When_Cache_Write_Throws()
    {
        var cache = Substitute.For<IDistributedCache>();
        cache.GetAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(Task.FromResult<byte[]?>(null));
        cache.SetAsync(
                Arg.Any<string>(), Arg.Any<byte[]>(), Arg.Any<DistributedCacheEntryOptions>(), Arg.Any<CancellationToken>())
            .Throws(new Exception("Redis unreachable"));

        var behavior = CreateBehavior<CacheableTestQuery>(cache);

        var act = () => behavior.Handle(
            new CacheableTestQuery("some-key"), () => Task.FromResult("fresh-value"), CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task Handle_Should_Skip_Cache_Entirely_For_NonCacheable_Request()
    {
        var cache = Substitute.For<IDistributedCache>();
        var behavior = CreateBehavior<NonCacheableTestQuery>(cache);

        var result = await behavior.Handle(
            new NonCacheableTestQuery(), () => Task.FromResult("value"), CancellationToken.None);

        result.Should().Be("value");
        await cache.DidNotReceiveWithAnyArgs().GetAsync(default!, default);
    }
}
