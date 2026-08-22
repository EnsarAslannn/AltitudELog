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
        username, "P@ssw0rd123!", "Test Pilot", $"LIC-{Guid.NewGuid():N}", $"{username}@example.com");

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
            new RegisterCommand("pilot_one", "P@ssw0rd123!", "Test Pilot", licenseNumber, "pilot_one@example.com"),
            CancellationToken.None);

        var act = () => handler.Handle(
            new RegisterCommand("pilot_two", "P@ssw0rd123!", "Test Pilot", licenseNumber, "pilot_two@example.com"),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task Handle_Should_Throw_When_Email_Already_Registered()
    {
        await using var context = CreateContext();
        var handler = new RegisterCommandHandler(context, Substitute.For<ILogger<RegisterCommandHandler>>());

        await handler.Handle(
            new RegisterCommand(
                "pilot_one", "P@ssw0rd123!", "Test Pilot", $"LIC-{Guid.NewGuid():N}", "shared@example.com"),
            CancellationToken.None);

        var act = () => handler.Handle(
            new RegisterCommand(
                "pilot_two", "P@ssw0rd123!", "Test Pilot", $"LIC-{Guid.NewGuid():N}", "shared@example.com"),
            CancellationToken.None);

        (await act.Should().ThrowAsync<InvalidOperationException>())
            .WithMessage("*Email*");
    }

    [Fact]
    public async Task Handle_Should_Store_Username_And_Email_Normalised()
    {
        await using var context = CreateContext();
        var handler = new RegisterCommandHandler(context, Substitute.For<ILogger<RegisterCommandHandler>>());

        var pilotId = await handler.Handle(
            new RegisterCommand(
                "  Ensar  ", "P@ssw0rd123!", "Test Pilot", $"LIC-{Guid.NewGuid():N}", "Ensar@Example.COM"),
            CancellationToken.None);

        var pilot = await context.Pilots.SingleAsync(p => p.Id == pilotId);
        pilot.Username.Should().Be("ensar");
        pilot.Email.Should().Be("ensar@example.com");
    }

    [Fact]
    public async Task Handle_Should_Reject_A_Username_Differing_Only_By_Case()
    {
        await using var context = CreateContext();
        var handler = new RegisterCommandHandler(context, Substitute.For<ILogger<RegisterCommandHandler>>());

        await handler.Handle(ValidCommand("Ensar"), CancellationToken.None);

        var act = () => handler.Handle(
            new RegisterCommand(
                "ensar", "P@ssw0rd123!", "Test Pilot", $"LIC-{Guid.NewGuid():N}", "other@example.com"),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task Handle_Should_Store_LicenseNumber_Trimmed_And_Upper_Cased()
    {
        await using var context = CreateContext();
        var handler = new RegisterCommandHandler(context, Substitute.For<ILogger<RegisterCommandHandler>>());

        var pilotId = await handler.Handle(
            new RegisterCommand(
                "ensar", "P@ssw0rd123!", "Test Pilot", "  tr-1234  ", "ensar@example.com"),
            CancellationToken.None);

        var pilot = await context.Pilots.SingleAsync(p => p.Id == pilotId);
        pilot.LicenseNumber.Should().Be("TR-1234");
    }

    [Fact]
    public async Task Handle_Should_Reject_A_LicenseNumber_Differing_Only_By_Case_Or_Whitespace()
    {
        await using var context = CreateContext();
        var handler = new RegisterCommandHandler(context, Substitute.For<ILogger<RegisterCommandHandler>>());

        await handler.Handle(
            new RegisterCommand("first", "P@ssw0rd123!", "Test Pilot", "TR-1234", "first@example.com"),
            CancellationToken.None);

        var act = () => handler.Handle(
            new RegisterCommand("second", "P@ssw0rd123!", "Test Pilot", " tr-1234 ", "second@example.com"),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }
}
