using AltitudELog.Application.Auth.Commands.ResetPassword;
using AltitudELog.Application.Common.Security;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AltitudELog.Application.UnitTests.Auth.Commands.ResetPassword;

public class ResetPasswordCommandHandlerTests
{
    private static TestApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestApplicationDbContext(options);
    }

    [Fact]
    public async Task Handle_Should_Clear_Refresh_Token_When_Password_Is_Reset()
    {
        await using var context = CreateContext();
        const string rawResetToken = "valid-reset-token";
        var pilot = new Pilot
        {
            Id = Guid.NewGuid(),
            Name = "Test Pilot",
            LicenseNumber = $"LIC-{Guid.NewGuid():N}",
            Rank = PilotRank.Captain,
            Username = $"pilot_{Guid.NewGuid():N}",
            PasswordHash = "old-hash",
            PasswordResetTokenHash = TokenHasher.Hash(rawResetToken),
            PasswordResetTokenExpiresAtUtc = DateTime.UtcNow.AddHours(1),
            RefreshTokenHash = "some-refresh-hash",
            RefreshTokenExpiresAtUtc = DateTime.UtcNow.AddDays(1)
        };
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var handler = new ResetPasswordCommandHandler(context, Substitute.For<ILogger<ResetPasswordCommandHandler>>());

        await handler.Handle(new ResetPasswordCommand(rawResetToken, "NewP@ssw0rd123!"), CancellationToken.None);

        var updated = await context.Pilots.SingleAsync(p => p.Id == pilot.Id);
        updated.RefreshTokenHash.Should().BeNull();
        updated.RefreshTokenExpiresAtUtc.Should().BeNull();
        updated.PasswordResetTokenHash.Should().BeNull();
    }
}
