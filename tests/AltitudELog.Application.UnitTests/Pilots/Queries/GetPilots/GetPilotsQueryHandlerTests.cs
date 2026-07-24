using AltitudELog.Application.Pilots.Queries.GetPilots;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.UnitTests.Pilots.Queries.GetPilots;

public class GetPilotsQueryHandlerTests
{
    private static TestApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestApplicationDbContext(options);
    }

    private static Pilot NewPilot(string name, PilotRank rank) => new()
    {
        Id = Guid.NewGuid(),
        Name = name,
        LicenseNumber = $"LIC-{Guid.NewGuid():N}",
        Rank = rank,
        Username = $"pilot_{Guid.NewGuid():N}",
        PasswordHash = "hash"
    };

    [Fact]
    public async Task Handle_Should_Return_All_Pilots_As_Dtos()
    {
        await using var context = CreateContext();
        context.Pilots.AddRange(
            NewPilot("Captain One", PilotRank.Captain),
            NewPilot("Trainee One", PilotRank.Trainee));
        await context.SaveChangesAsync();

        var handler = new GetPilotsQueryHandler(context);

        var result = await handler.Handle(new GetPilotsQuery(), CancellationToken.None);

        result.Should().HaveCount(2);
        result.Should().Contain(p => p.Name == "Captain One" && p.Rank == PilotRank.Captain);
        result.Should().Contain(p => p.Name == "Trainee One" && p.Rank == PilotRank.Trainee);
    }

    [Fact]
    public async Task Handle_Should_Return_Empty_List_When_No_Pilots_Exist()
    {
        await using var context = CreateContext();
        var handler = new GetPilotsQueryHandler(context);

        var result = await handler.Handle(new GetPilotsQuery(), CancellationToken.None);

        result.Should().BeEmpty();
    }
}
