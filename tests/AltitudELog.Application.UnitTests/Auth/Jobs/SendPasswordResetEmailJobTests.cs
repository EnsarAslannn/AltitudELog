using AltitudELog.Application.Auth.Jobs;
using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.Common.Security;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AltitudELog.Application.UnitTests.Auth.Jobs;

public class SendPasswordResetEmailJobTests
{
    private static TestApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestApplicationDbContext(options);
    }

    private static Pilot NewPilot(string? email) => new()
    {
        Id = Guid.NewGuid(),
        Name = "Test Pilot",
        LicenseNumber = $"LIC-{Guid.NewGuid():N}",
        Rank = PilotRank.Captain,
        Username = $"pilot_{Guid.NewGuid():N}",
        PasswordHash = "hash",
        Email = email
    };

    [Fact]
    public async Task ExecuteAsync_Should_Issue_A_Token_And_Send_It()
    {
        await using var context = CreateContext();
        var pilot = NewPilot("pilot@example.com");
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var emailService = Substitute.For<IEmailService>();
        var job = new SendPasswordResetEmailJob(
            context, emailService, Substitute.For<ILogger<SendPasswordResetEmailJob>>());

        await job.ExecuteAsync(pilot.Id, CancellationToken.None);

        var updated = await context.Pilots.SingleAsync(p => p.Id == pilot.Id);
        updated.PasswordResetTokenHash.Should().NotBeNullOrEmpty();
        updated.PasswordResetTokenExpiresAtUtc.Should().NotBeNull().And.Subject.As<DateTime>()
            .Should().BeAfter(DateTime.UtcNow);

        await emailService.Received(1).SendPasswordResetEmailAsync(
            "pilot@example.com", Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ExecuteAsync_Should_Email_The_Raw_Token_But_Store_Only_Its_Hash()
    {
        await using var context = CreateContext();
        var pilot = NewPilot("pilot@example.com");
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        string? sentToken = null;
        var emailService = Substitute.For<IEmailService>();
        await emailService.SendPasswordResetEmailAsync(
            Arg.Any<string>(), Arg.Do<string>(token => sentToken = token), Arg.Any<CancellationToken>());

        var job = new SendPasswordResetEmailJob(
            context, emailService, Substitute.For<ILogger<SendPasswordResetEmailJob>>());

        await job.ExecuteAsync(pilot.Id, CancellationToken.None);

        var updated = await context.Pilots.SingleAsync(p => p.Id == pilot.Id);
        sentToken.Should().NotBeNullOrEmpty();
        updated.PasswordResetTokenHash.Should().NotBe(sentToken);
        updated.PasswordResetTokenHash.Should().Be(TokenHasher.Hash(sentToken!));
    }

    [Fact]
    public async Task ExecuteAsync_Should_No_Op_When_The_Pilot_Is_Gone()
    {
        await using var context = CreateContext();
        var emailService = Substitute.For<IEmailService>();
        var job = new SendPasswordResetEmailJob(
            context, emailService, Substitute.For<ILogger<SendPasswordResetEmailJob>>());

        await job.ExecuteAsync(Guid.NewGuid(), CancellationToken.None);

        await emailService.DidNotReceive().SendPasswordResetEmailAsync(
            Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ExecuteAsync_Should_No_Op_When_The_Pilot_Has_No_Email()
    {
        await using var context = CreateContext();
        var pilot = NewPilot(email: null);
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var emailService = Substitute.For<IEmailService>();
        var job = new SendPasswordResetEmailJob(
            context, emailService, Substitute.For<ILogger<SendPasswordResetEmailJob>>());

        await job.ExecuteAsync(pilot.Id, CancellationToken.None);

        await emailService.DidNotReceive().SendPasswordResetEmailAsync(
            Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
    }
}
