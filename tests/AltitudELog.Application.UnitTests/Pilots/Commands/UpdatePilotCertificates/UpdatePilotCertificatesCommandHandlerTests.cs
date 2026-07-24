using AltitudELog.Application.Common.Caching;
using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.Pilots.Commands.UpdatePilotCertificates;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AltitudELog.Application.UnitTests.Pilots.Commands.UpdatePilotCertificates;

public class UpdatePilotCertificatesCommandHandlerTests
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
        PasswordHash = "hash"
    };

    [Fact]
    public async Task Handle_Should_Update_Certificate_Dates_For_Current_Pilot()
    {
        await using var context = CreateContext();
        var pilot = NewPilot();
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var currentUser = Substitute.For<ICurrentUserService>();
        currentUser.PilotId.Returns(pilot.Id);

        var handler = new UpdatePilotCertificatesCommandHandler(
            context, currentUser, Substitute.For<ILogger<UpdatePilotCertificatesCommandHandler>>());

        var licenseExpiry = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(1));
        var medicalExpiry = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(6));
        var command = new UpdatePilotCertificatesCommand(licenseExpiry, medicalExpiry);

        await handler.Handle(command, CancellationToken.None);

        var updated = await context.Pilots.SingleAsync(p => p.Id == pilot.Id);
        updated.LicenseExpiryDate.Should().Be(licenseExpiry);
        updated.MedicalExpiryDate.Should().Be(medicalExpiry);
    }

    [Fact]
    public async Task Handle_Should_Set_ResolvedPilotId_So_CacheKeysToInvalidate_Includes_Profile_And_Stats()
    {
        await using var context = CreateContext();
        var pilot = NewPilot();
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var currentUser = Substitute.For<ICurrentUserService>();
        currentUser.PilotId.Returns(pilot.Id);

        var handler = new UpdatePilotCertificatesCommandHandler(
            context, currentUser, Substitute.For<ILogger<UpdatePilotCertificatesCommandHandler>>());

        var command = new UpdatePilotCertificatesCommand(null, null);

        await handler.Handle(command, CancellationToken.None);

        command.CacheKeysToInvalidate.Should().BeEquivalentTo(
        [
            CacheKeys.PilotProfile(pilot.Id),
            CacheKeys.Stats
        ]);
    }

    [Fact]
    public async Task Handle_Should_Throw_Unauthorized_When_No_Current_Pilot()
    {
        await using var context = CreateContext();
        var currentUser = Substitute.For<ICurrentUserService>();
        currentUser.PilotId.Returns((Guid?)null);

        var handler = new UpdatePilotCertificatesCommandHandler(
            context, currentUser, Substitute.For<ILogger<UpdatePilotCertificatesCommandHandler>>());

        var act = () => handler.Handle(new UpdatePilotCertificatesCommand(null, null), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task Handle_Should_Throw_Unauthorized_When_Current_Pilot_No_Longer_Exists()
    {
        await using var context = CreateContext();
        var currentUser = Substitute.For<ICurrentUserService>();
        currentUser.PilotId.Returns(Guid.NewGuid());

        var handler = new UpdatePilotCertificatesCommandHandler(
            context, currentUser, Substitute.For<ILogger<UpdatePilotCertificatesCommandHandler>>());

        var act = () => handler.Handle(new UpdatePilotCertificatesCommand(null, null), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}
