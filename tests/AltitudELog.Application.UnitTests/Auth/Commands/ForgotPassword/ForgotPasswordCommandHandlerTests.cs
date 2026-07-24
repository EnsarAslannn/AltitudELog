using AltitudELog.Application.Auth.Commands.ForgotPassword;
using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
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

    [Fact]
    public async Task Handle_Should_Not_Send_Email_When_Pilot_Not_Found()
    {
        await using var context = CreateContext();
        var emailService = Substitute.For<IEmailService>();
        var handler = new ForgotPasswordCommandHandler(
            context, emailService, Substitute.For<ILogger<ForgotPasswordCommandHandler>>());

        await handler.Handle(new ForgotPasswordCommand("nobody@example.com"), CancellationToken.None);

        await emailService.DidNotReceive().SendPasswordResetEmailAsync(
            Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_Should_Not_Persist_Anything_When_Pilot_Not_Found()
    {
        await using var context = CreateContext();
        var pilot = NewPilot("registered@example.com");
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var emailService = Substitute.For<IEmailService>();
        var handler = new ForgotPasswordCommandHandler(
            context, emailService, Substitute.For<ILogger<ForgotPasswordCommandHandler>>());

        await handler.Handle(new ForgotPasswordCommand("unregistered@example.com"), CancellationToken.None);

        var unchanged = await context.Pilots.SingleAsync(p => p.Id == pilot.Id);
        unchanged.PasswordResetTokenHash.Should().BeNull();
        unchanged.PasswordResetTokenExpiresAtUtc.Should().BeNull();
    }

    [Fact]
    public async Task Handle_Should_Set_Token_And_Send_Email_When_Pilot_Found()
    {
        await using var context = CreateContext();
        var pilot = NewPilot("pilot@example.com");
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var emailService = Substitute.For<IEmailService>();
        var handler = new ForgotPasswordCommandHandler(
            context, emailService, Substitute.For<ILogger<ForgotPasswordCommandHandler>>());

        await handler.Handle(new ForgotPasswordCommand("pilot@example.com"), CancellationToken.None);

        var updated = await context.Pilots.SingleAsync(p => p.Id == pilot.Id);
        updated.PasswordResetTokenHash.Should().NotBeNullOrEmpty();
        updated.PasswordResetTokenExpiresAtUtc.Should().NotBeNull();
        updated.PasswordResetTokenExpiresAtUtc!.Value.Should().BeAfter(DateTime.UtcNow);

        await emailService.Received(1).SendPasswordResetEmailAsync(
            "pilot@example.com", Arg.Any<string>(), Arg.Any<CancellationToken>());
    }
}
