using AltitudELog.Application.Auth.Commands.RefreshToken;
using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.Common.Security;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AltitudELog.Application.UnitTests.Auth.Commands.RefreshToken;

public class RefreshTokenCommandHandlerTests
{
    private static TestApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestApplicationDbContext(options);
    }

    private static Pilot NewPilot(string? refreshToken, DateTime? expiresAtUtc) => new()
    {
        Id = Guid.NewGuid(),
        Name = "Test Pilot",
        LicenseNumber = $"LIC-{Guid.NewGuid():N}",
        Rank = PilotRank.Captain,
        Username = $"pilot_{Guid.NewGuid():N}",
        PasswordHash = "irrelevant",
        RefreshTokenHash = refreshToken is null ? null : TokenHasher.Hash(refreshToken),
        RefreshTokenExpiresAtUtc = expiresAtUtc
    };

    [Fact]
    public async Task Handle_Should_Rotate_Refresh_Token_For_Valid_Token()
    {
        await using var context = CreateContext();
        const string rawToken = "valid-refresh-token";
        var pilot = NewPilot(rawToken, DateTime.UtcNow.AddDays(1));
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var jwtGenerator = Substitute.For<IJwtTokenGenerator>();
        var expiresAt = DateTime.UtcNow.AddMinutes(15);
        jwtGenerator.GenerateToken(Arg.Any<Pilot>()).Returns(("new-access-token", expiresAt));

        var handler = new RefreshTokenCommandHandler(
            context, jwtGenerator, Substitute.For<ILogger<RefreshTokenCommandHandler>>());

        var result = await handler.Handle(new RefreshTokenCommand(rawToken), CancellationToken.None);

        result.Token.Should().Be("new-access-token");
        result.PilotId.Should().Be(pilot.Id);
        result.RefreshToken.Should().NotBe(rawToken);

        var updated = await context.Pilots.SingleAsync(p => p.Id == pilot.Id);
        updated.RefreshTokenHash.Should().NotBe(TokenHasher.Hash(rawToken));
        updated.RefreshTokenHash.Should().Be(TokenHasher.Hash(result.RefreshToken));
    }

    [Fact]
    public async Task Handle_Should_Throw_When_Token_Does_Not_Match_Any_Pilot()
    {
        await using var context = CreateContext();
        var handler = new RefreshTokenCommandHandler(
            context, Substitute.For<IJwtTokenGenerator>(), Substitute.For<ILogger<RefreshTokenCommandHandler>>());

        var act = () => handler.Handle(new RefreshTokenCommand("nonexistent-token"), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task Handle_Should_Throw_When_Token_Is_Expired()
    {
        await using var context = CreateContext();
        const string rawToken = "expired-refresh-token";
        var pilot = NewPilot(rawToken, DateTime.UtcNow.AddMinutes(-1));
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var handler = new RefreshTokenCommandHandler(
            context, Substitute.For<IJwtTokenGenerator>(), Substitute.For<ILogger<RefreshTokenCommandHandler>>());

        var act = () => handler.Handle(new RefreshTokenCommand(rawToken), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}
