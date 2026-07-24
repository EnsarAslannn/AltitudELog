using AltitudELog.Application.Common.Behaviors;
using AltitudELog.Application.Common.Caching;
using AwesomeAssertions;
using MediatR;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace AltitudELog.Application.UnitTests.Common.Behaviors;

public class CacheInvalidationBehaviorTests
{
    // Public (not private/nested-private) because CacheInvalidationBehavior<TRequest,TResponse>
    // depends on ILogger<CacheInvalidationBehavior<TRequest,TResponse>>, and NSubstitute/Castle
    // DynamicProxy needs to generate a proxy over that closed generic type — which requires
    // TRequest to be an accessible (public) type, not a private nested class.
    public record InvalidatingTestCommand(string[] Keys) : IRequest<string>, ICacheInvalidatorCommand
    {
        public string[] CacheKeysToInvalidate => Keys;
    }

    public record PlainTestCommand : IRequest<string>;

    [Fact]
    public async Task Handle_Should_Call_Next_Then_Remove_Each_Invalidated_Key()
    {
        var cache = Substitute.For<IDistributedCache>();
        var behavior = new CacheInvalidationBehavior<InvalidatingTestCommand, string>(
            cache, Substitute.For<ILogger<CacheInvalidationBehavior<InvalidatingTestCommand, string>>>());

        var result = await behavior.Handle(
            new InvalidatingTestCommand(["key:one", "key:two"]),
            () => Task.FromResult("handled"),
            CancellationToken.None);

        result.Should().Be("handled");
        await cache.Received(1).RemoveAsync("key:one", Arg.Any<CancellationToken>());
        await cache.Received(1).RemoveAsync("key:two", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_Should_Not_Touch_Cache_For_NonInvalidator_Request()
    {
        var cache = Substitute.For<IDistributedCache>();
        var behavior = new CacheInvalidationBehavior<PlainTestCommand, string>(
            cache, Substitute.For<ILogger<CacheInvalidationBehavior<PlainTestCommand, string>>>());

        var result = await behavior.Handle(
            new PlainTestCommand(), () => Task.FromResult("handled"), CancellationToken.None);

        result.Should().Be("handled");
        await cache.DidNotReceiveWithAnyArgs().RemoveAsync(default!, default);
    }

    [Fact]
    public async Task Handle_Should_Not_Throw_When_Cache_Removal_Throws()
    {
        var cache = Substitute.For<IDistributedCache>();
        cache.RemoveAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Throws(new Exception("Redis unreachable"));

        var behavior = new CacheInvalidationBehavior<InvalidatingTestCommand, string>(
            cache, Substitute.For<ILogger<CacheInvalidationBehavior<InvalidatingTestCommand, string>>>());

        var act = () => behavior.Handle(
            new InvalidatingTestCommand(["key:one"]), () => Task.FromResult("handled"), CancellationToken.None);

        await act.Should().NotThrowAsync();
    }
}
