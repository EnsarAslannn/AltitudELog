using AltitudELog.Application.Auth.Commands.ResetPassword;
using AltitudELog.Application.Common.Behaviors;
using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.Flights.Commands.CancelFlight;
using AltitudELog.Application.Flights.Commands.CreateFlight;
using AltitudELog.Application.Flights.Commands.UpdateFlight;
using AltitudELog.Application.Pilots.Commands.UpdatePilotCertificates;
using AltitudELog.Application.UnitTests.TestUtilities;
using AwesomeAssertions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AltitudELog.Application.UnitTests.Common.Behaviors;

/// <summary>
/// Guards the generic constraint on the three pipeline behaviors.
///
/// MediatR 12's non-generic <see cref="IRequest"/> — what every void command implements — derives
/// from <c>IBaseRequest</c>, NOT from <c>IRequest&lt;Unit&gt;</c>. If a behavior is constrained to
/// <c>where TRequest : IRequest&lt;TResponse&gt;</c>, the DI container cannot close the open
/// generic over <c>&lt;TVoidCommand, Unit&gt;</c> and silently registers nothing — no exception, no
/// log. Void commands then run with no validation and no cache invalidation at all.
///
/// The behaviors themselves are directly instantiated in their own unit tests, so only a test that
/// goes through the real container can catch this. Do not relax these assertions.
/// </summary>
public class PipelineBehaviorRegistrationTests
{
    private static ServiceProvider BuildProvider()
    {
        var services = new ServiceCollection();

        services.AddLogging();
        services.AddSingleton(Substitute.For<IDistributedCache>());
        services.AddScoped<IApplicationDbContext>(_ => new TestApplicationDbContext(
            new DbContextOptionsBuilder<TestApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options));

        services.AddApplicationServices();

        return services.BuildServiceProvider();
    }

    public static TheoryData<Type> VoidCommandTypes() =>
    [
        typeof(UpdateFlightCommand),
        typeof(CancelFlightCommand),
        typeof(UpdatePilotCertificatesCommand),
        typeof(ResetPasswordCommand)
    ];

    [Theory]
    [MemberData(nameof(VoidCommandTypes))]
    public void Void_Commands_Should_Resolve_All_Three_Pipeline_Behaviors(Type commandType)
    {
        using var provider = BuildProvider();
        using var scope = provider.CreateScope();

        var behaviorType = typeof(IPipelineBehavior<,>).MakeGenericType(commandType, typeof(Unit));
        var behaviors = scope.ServiceProvider.GetServices(behaviorType).ToList();

        behaviors.Should().HaveCount(3, "void commands must go through validation, caching and cache invalidation");
        behaviors.Select(b => b!.GetType().GetGenericTypeDefinition()).Should().BeEquivalentTo(
        [
            typeof(ValidationBehavior<,>),
            typeof(CachingBehavior<,>),
            typeof(CacheInvalidationBehavior<,>)
        ]);
    }

    [Fact]
    public void Commands_With_A_Response_Should_Resolve_All_Three_Pipeline_Behaviors()
    {
        using var provider = BuildProvider();
        using var scope = provider.CreateScope();

        var behaviors = scope.ServiceProvider
            .GetServices<IPipelineBehavior<CreateFlightCommand, Guid>>()
            .ToList();

        behaviors.Should().HaveCount(3);
    }

    [Fact]
    public void Void_Command_Validators_Should_Be_Reachable_Through_The_Registered_Behavior()
    {
        using var provider = BuildProvider();
        using var scope = provider.CreateScope();

        var validators = scope.ServiceProvider
            .GetServices<FluentValidation.IValidator<UpdateFlightCommand>>()
            .ToList();

        validators.Should().ContainSingle().Which.Should().BeOfType<UpdateFlightCommandValidator>();
    }
}
