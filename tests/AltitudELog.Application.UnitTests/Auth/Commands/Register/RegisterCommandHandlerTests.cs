using AltitudELog.Application.Auth.Commands.Register;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AltitudELog.Application.UnitTests.Auth.Commands.Register;

public class RegisterCommandHandlerTests
{
    private static TestApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestApplicationDbContext(options);
    }

    private static RegisterCommand ValidCommand(string username) => new(
        username, "P@ssw0rd123!", "Test Pilot", $"LIC-{Guid.NewGuid():N}");

    [Fact]
    public async Task Handle_Should_Always_Register_Pilot_As_Trainee()
    {
        await using var context = CreateContext();
        var handler = new RegisterCommandHandler(context, Substitute.For<ILogger<RegisterCommandHandler>>());

        var pilotId = await handler.Handle(ValidCommand("jdoe"), CancellationToken.None);

        var pilot = await context.Pilots.SingleAsync(p => p.Id == pilotId);
        pilot.Rank.Should().Be(PilotRank.Trainee);
    }

    [Fact]
    public async Task Handle_Should_Hash_The_Password()
    {
        await using var context = CreateContext();
        var handler = new RegisterCommandHandler(context, Substitute.For<ILogger<RegisterCommandHandler>>());

        var pilotId = await handler.Handle(ValidCommand("jdoe"), CancellationToken.None);

        var pilot = await context.Pilots.SingleAsync(p => p.Id == pilotId);
        pilot.PasswordHash.Should().NotBe("P@ssw0rd123!");
        pilot.PasswordHash.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Handle_Should_Throw_When_Username_Already_Taken()
    {
        await using var context = CreateContext();
        var handler = new RegisterCommandHandler(context, Substitute.For<ILogger<RegisterCommandHandler>>());

        await handler.Handle(ValidCommand("duplicate"), CancellationToken.None);

        var act = () => handler.Handle(ValidCommand("duplicate"), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task Handle_Should_Throw_When_LicenseNumber_Already_Taken()
    {
        await using var context = CreateContext();
        var handler = new RegisterCommandHandler(context, Substitute.For<ILogger<RegisterCommandHandler>>());
        var licenseNumber = $"LIC-{Guid.NewGuid():N}";

        await handler.Handle(
            new RegisterCommand("pilot_one", "P@ssw0rd123!", "Test Pilot", licenseNumber), CancellationToken.None);

        var act = () => handler.Handle(
            new RegisterCommand("pilot_two", "P@ssw0rd123!", "Test Pilot", licenseNumber), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }
}
