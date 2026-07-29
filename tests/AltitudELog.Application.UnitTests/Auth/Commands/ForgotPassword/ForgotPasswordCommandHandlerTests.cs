using AltitudELog.Application.Auth.Commands.ForgotPassword;
using AltitudELog.Application.Auth.Jobs;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Hangfire;
using Hangfire.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AltitudELog.Application.UnitTests.Auth.Commands.ForgotPassword;

public class ForgotPasswordCommandHandlerTests
{
    private static TestApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestApplicationDbContext(options);
    }

    private static Pilot NewPilot(string email) => new()
    {
        Id = Guid.NewGuid(),
        Name = "Test Pilot",
        LicenseNumber = $"LIC-{Guid.NewGuid():N}",
        Rank = PilotRank.Captain,
        Username = $"pilot_{Guid.NewGuid():N}",
        PasswordHash = "hash",
        Email = email
    };

    // Enqueue<T> is an extension method over Create(Job, IState), so that's what a substitute can
    // actually observe.
    private static IEnumerable<Job> EnqueuedJobs(IBackgroundJobClient client) =>
        client.ReceivedCalls()
            .Where(call => call.GetMethodInfo().Name == nameof(IBackgroundJobClient.Create))
            .Select(call => (Job)call.GetArguments()[0]!);

    [Fact]
    public async Task Handle_Should_Not_Enqueue_Anything_For_An_Unregistered_Email()
    {
        await using var context = CreateContext();
        var backgroundJobClient = Substitute.For<IBackgroundJobClient>();
        var handler = new ForgotPasswordCommandHandler(
            context, backgroundJobClient, Substitute.For<ILogger<ForgotPasswordCommandHandler>>());

        await handler.Handle(new ForgotPasswordCommand("nobody@example.com"), CancellationToken.None);

        EnqueuedJobs(backgroundJobClient).Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_Should_Not_Persist_Anything_For_An_Unregistered_Email()
    {
        await using var context = CreateContext();
        var pilot = NewPilot("registered@example.com");
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var handler = new ForgotPasswordCommandHandler(
            context,
            Substitute.For<IBackgroundJobClient>(),
            Substitute.For<ILogger<ForgotPasswordCommandHandler>>());

        await handler.Handle(new ForgotPasswordCommand("unregistered@example.com"), CancellationToken.None);

        var unchanged = await context.Pilots.SingleAsync(p => p.Id == pilot.Id);
        unchanged.PasswordResetTokenHash.Should().BeNull();
        unchanged.PasswordResetTokenExpiresAtUtc.Should().BeNull();
    }

    [Fact]
    public async Task Handle_Should_Enqueue_The_Delivery_Job_For_A_Registered_Email()
    {
        await using var context = CreateContext();
        var pilot = NewPilot("pilot@example.com");
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var backgroundJobClient = Substitute.For<IBackgroundJobClient>();
        var handler = new ForgotPasswordCommandHandler(
            context, backgroundJobClient, Substitute.For<ILogger<ForgotPasswordCommandHandler>>());

        await handler.Handle(new ForgotPasswordCommand("pilot@example.com"), CancellationToken.None);

        var job = EnqueuedJobs(backgroundJobClient).Should().ContainSingle().Subject;
        job.Type.Should().Be<SendPasswordResetEmailJob>();
        job.Args[0].Should().Be(pilot.Id);
    }

    [Fact]
    public async Task Handle_Should_Match_A_Registered_Email_Regardless_Of_Casing()
    {
        await using var context = CreateContext();
        var pilot = NewPilot("pilot@example.com");
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var backgroundJobClient = Substitute.For<IBackgroundJobClient>();
        var handler = new ForgotPasswordCommandHandler(
            context, backgroundJobClient, Substitute.For<ILogger<ForgotPasswordCommandHandler>>());

        await handler.Handle(new ForgotPasswordCommand("  Pilot@Example.COM "), CancellationToken.None);

        EnqueuedJobs(backgroundJobClient).Should().ContainSingle();
    }

    [Fact]
    public async Task Handle_Should_Not_Send_Email_Inline()
    {
        // The anti-enumeration design rests on both branches costing the same. An inline SMTP
        // round trip has no upper bound, so the matching branch was reliably slower than the
        // floor and the timing still gave away which addresses are registered.
        await using var context = CreateContext();
        var pilot = NewPilot("pilot@example.com");
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var handler = new ForgotPasswordCommandHandler(
            context,
            Substitute.For<IBackgroundJobClient>(),
            Substitute.For<ILogger<ForgotPasswordCommandHandler>>());

        await handler.Handle(new ForgotPasswordCommand("pilot@example.com"), CancellationToken.None);

        // The token is issued by the job, so nothing is written on the request path at all.
        var unchanged = await context.Pilots.SingleAsync(p => p.Id == pilot.Id);
        unchanged.PasswordResetTokenHash.Should().BeNull();
    }

    [Theory]
    [InlineData("pilot@example.com")]
    [InlineData("nobody@example.com")]
    public async Task Handle_Should_Take_At_Least_The_Minimum_Duration_On_Both_Branches(string email)
    {
        await using var context = CreateContext();
        context.Pilots.Add(NewPilot("pilot@example.com"));
        await context.SaveChangesAsync();

        var handler = new ForgotPasswordCommandHandler(
            context,
            Substitute.For<IBackgroundJobClient>(),
            Substitute.For<ILogger<ForgotPasswordCommandHandler>>());

        var started = DateTime.UtcNow;
        await handler.Handle(new ForgotPasswordCommand(email), CancellationToken.None);

        // 280ms rather than the 300ms floor: timer resolution makes an exact comparison flaky.
        (DateTime.UtcNow - started).Should().BeGreaterThan(TimeSpan.FromMilliseconds(280));
    }
}
