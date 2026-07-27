using AltitudELog.Application.Auth.Commands.Logout;
using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AltitudELog.Application.UnitTests.Auth.Commands.Logout;

public class LogoutCommandHandlerTests
{
    private static TestApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestApplicationDbContext(options);
    }

    private static Pilot NewPilot() => new()
    {
        Id = Guid.NewGuid(),
        Name = "Test Pilot",
        LicenseNumber = $"LIC-{Guid.NewGuid():N}",
        Rank = PilotRank.Captain,
        Username = $"pilot_{Guid.NewGuid():N}",
        PasswordHash = "irrelevant",
        RefreshTokenHash = "some-hash",
        RefreshTokenExpiresAtUtc = DateTime.UtcNow.AddDays(1)
    };

    [Fact]
    public async Task Handle_Should_Clear_Refresh_Token_For_Current_Pilot()
    {
        await using var context = CreateContext();
        var pilot = NewPilot();
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var currentUserService = Substitute.For<ICurrentUserService>();
        currentUserService.PilotId.Returns(pilot.Id);

        var handler = new LogoutCommandHandler(
            context, currentUserService, Substitute.For<ILogger<LogoutCommandHandler>>());

        await handler.Handle(new LogoutCommand(), CancellationToken.None);

        var updated = await context.Pilots.SingleAsync(p => p.Id == pilot.Id);
        updated.RefreshTokenHash.Should().BeNull();
        updated.RefreshTokenExpiresAtUtc.Should().BeNull();
    }

    [Fact]
    public async Task Handle_Should_Throw_When_No_Current_Pilot()
    {
        await using var context = CreateContext();
        var currentUserService = Substitute.For<ICurrentUserService>();
        currentUserService.PilotId.Returns((Guid?)null);

        var handler = new LogoutCommandHandler(
            context, currentUserService, Substitute.For<ILogger<LogoutCommandHandler>>());

        var act = () => handler.Handle(new LogoutCommand(), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}
