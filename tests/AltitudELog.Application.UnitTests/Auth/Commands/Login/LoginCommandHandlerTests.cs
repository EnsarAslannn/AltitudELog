using AltitudELog.Application.Auth.Commands.Login;
using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AltitudELog.Application.UnitTests.Auth.Commands.Login;

public class LoginCommandHandlerTests
{
    private static TestApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestApplicationDbContext(options);
    }

    private static async Task<Pilot> SeedPilotAsync(TestApplicationDbContext context, string username, string password)
    {
        var hasher = new PasswordHasher<Pilot>();
        var pilot = new Pilot
        {
            Id = Guid.NewGuid(),
            Name = "Test Pilot",
            LicenseNumber = $"LIC-{Guid.NewGuid():N}",
            Rank = PilotRank.Captain,
            Username = username
        };
        pilot.PasswordHash = hasher.HashPassword(pilot, password);

        context.Pilots.Add(pilot);
        await context.SaveChangesAsync(CancellationToken.None);

        return pilot;
    }

    [Fact]
    public async Task Handle_Should_Return_Token_For_Valid_Credentials()
    {
        await using var context = CreateContext();
        var pilot = await SeedPilotAsync(context, "jdoe", "P@ssw0rd123!");

        var jwtGenerator = Substitute.For<IJwtTokenGenerator>();
        var expiresAt = DateTime.UtcNow.AddHours(1);
        jwtGenerator.GenerateToken(Arg.Any<Pilot>()).Returns(("fake-token", expiresAt));

        var handler = new LoginCommandHandler(context, jwtGenerator, Substitute.For<ILogger<LoginCommandHandler>>());

        var result = await handler.Handle(new LoginCommand("jdoe", "P@ssw0rd123!"), CancellationToken.None);

        result.Token.Should().Be("fake-token");
        result.PilotId.Should().Be(pilot.Id);
        result.Rank.Should().Be("Captain");
    }

    [Fact]
    public async Task Handle_Should_Throw_Unauthorized_When_Username_Not_Found()
    {
        await using var context = CreateContext();
        var handler = new LoginCommandHandler(
            context, Substitute.For<IJwtTokenGenerator>(), Substitute.For<ILogger<LoginCommandHandler>>());

        var act = () => handler.Handle(new LoginCommand("nobody", "whatever"), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task Handle_Should_Throw_Unauthorized_When_Password_Is_Wrong()
    {
        await using var context = CreateContext();
        await SeedPilotAsync(context, "jdoe", "P@ssw0rd123!");

        var handler = new LoginCommandHandler(
            context, Substitute.For<IJwtTokenGenerator>(), Substitute.For<ILogger<LoginCommandHandler>>());

        var act = () => handler.Handle(new LoginCommand("jdoe", "WrongPassword!"), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}
