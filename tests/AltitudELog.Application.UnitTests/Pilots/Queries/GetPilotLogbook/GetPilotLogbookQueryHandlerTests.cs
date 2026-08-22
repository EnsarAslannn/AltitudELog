using AltitudELog.Application.Common.Exceptions;
using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.Pilots.Queries.GetPilotLogbook;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace AltitudELog.Application.UnitTests.Pilots.Queries.GetPilotLogbook;

public class GetPilotLogbookQueryHandlerTests
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
        Rank = PilotRank.FirstOfficer,
        Username = $"pilot_{Guid.NewGuid():N}",
        PasswordHash = "hash"
    };

    private static ICurrentUserService Caller(Guid? pilotId, PilotRank? rank)
    {
        var currentUser = Substitute.For<ICurrentUserService>();
        currentUser.PilotId.Returns(pilotId);
        currentUser.Rank.Returns(rank);
        return currentUser;
    }

    [Fact]
    public async Task Handle_Should_Return_Logbook_For_The_Owning_Pilot()
    {
        await using var context = CreateContext();
        var pilot = NewPilot();
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var handler = new GetPilotLogbookQueryHandler(context, Caller(pilot.Id, PilotRank.Trainee));

        var result = await handler.Handle(new GetPilotLogbookQuery(pilot.Id), CancellationToken.None);

        result.Should().NotBeNull();
        result!.PilotId.Should().Be(pilot.Id);
    }

    [Theory]
    [InlineData(PilotRank.Captain)]
    [InlineData(PilotRank.ChiefPilot)]
    public async Task Handle_Should_Return_Another_Pilots_Logbook_For_Command_Ranks(PilotRank callerRank)
    {
        await using var context = CreateContext();
        var subject = NewPilot();
        context.Pilots.Add(subject);
        await context.SaveChangesAsync();

        var handler = new GetPilotLogbookQueryHandler(context, Caller(Guid.NewGuid(), callerRank));

        var result = await handler.Handle(new GetPilotLogbookQuery(subject.Id), CancellationToken.None);

        result.Should().NotBeNull();
        result!.PilotId.Should().Be(subject.Id);
    }

    [Theory]
    [InlineData(PilotRank.Trainee)]
    [InlineData(PilotRank.FirstOfficer)]
    public async Task Handle_Should_Throw_Forbidden_For_Another_Pilots_Logbook_Below_Command_Rank(PilotRank callerRank)
    {
        await using var context = CreateContext();
        var subject = NewPilot();
        context.Pilots.Add(subject);
        await context.SaveChangesAsync();

        var handler = new GetPilotLogbookQueryHandler(context, Caller(Guid.NewGuid(), callerRank));

        var act = () => handler.Handle(new GetPilotLogbookQuery(subject.Id), CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenAccessException>();
    }

    [Fact]
    public async Task Handle_Should_Throw_Forbidden_Before_Revealing_Whether_The_Pilot_Exists()
    {
        await using var context = CreateContext();

        var handler = new GetPilotLogbookQueryHandler(context, Caller(Guid.NewGuid(), PilotRank.Trainee));

        var act = () => handler.Handle(new GetPilotLogbookQuery(Guid.NewGuid()), CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenAccessException>();
    }
}
