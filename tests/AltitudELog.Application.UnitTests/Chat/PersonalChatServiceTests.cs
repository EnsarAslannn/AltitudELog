using AltitudELog.Application.Chat;
using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using CrewEntity = AltitudELog.Domain.Entities.Crew;

namespace AltitudELog.Application.UnitTests.Chat;

public class PersonalChatServiceTests
{
    [Fact]
    public async Task AnswerAsync_Should_Sum_Only_Current_Month_NonCancelled_Flights_For_Current_Pilot()
    {
        await using var context = CreateContext();
        var pilot = NewPilot();
        var otherPilot = NewPilot();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var currentMonthFlight = NewFlight(today, TimeSpan.FromMinutes(150));
        var cancelledFlight = NewFlight(today, TimeSpan.FromHours(8), isCancelled: true);
        var otherPilotFlight = NewFlight(today, TimeSpan.FromHours(5));
        var previousMonthFlight = NewFlight(today.AddMonths(-1), TimeSpan.FromHours(4));

        context.Pilots.AddRange(pilot, otherPilot);
        context.Flights.AddRange(currentMonthFlight, cancelledFlight, otherPilotFlight, previousMonthFlight);
        context.Crew.AddRange(
            Assignment(pilot, currentMonthFlight),
            Assignment(pilot, cancelledFlight),
            Assignment(otherPilot, otherPilotFlight),
            Assignment(pilot, previousMonthFlight));
        await context.SaveChangesAsync();

        var currentUser = Substitute.For<ICurrentUserService>();
        currentUser.PilotId.Returns(pilot.Id);
        var service = new PersonalChatService(context, currentUser);

        var result = await service.TryAnswerAsync(
            new ChatRequest("Bu ay kaç saat uçtum?", "tr", []),
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.Answer.Should().Contain("2 saat 30 dakika");
        result.Sources.Should().ContainSingle(source => source.Url == $"/pilots/{pilot.Id}");
        result.UsedAi.Should().BeFalse();
    }

    [Fact]
    public async Task AnswerAsync_Should_Report_Current_Pilots_Certificate_Expiry_Dates()
    {
        await using var context = CreateContext();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var pilot = NewPilot();
        pilot.LicenseExpiryDate = today.AddDays(10);
        pilot.MedicalExpiryDate = today.AddDays(25);
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var service = CreateService(context, pilot.Id);

        var result = await service.TryAnswerAsync(
            new ChatRequest("Sertifikalarım ne zaman bitiyor?", "tr", []),
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.Answer.Should().Contain("Lisans").And.Contain("10 gün");
        result.Answer.Should().Contain("Sağlık").And.Contain("25 gün");
        result.Sources.Should().ContainSingle(source => source.Url == $"/pilots/{pilot.Id}");
    }

    [Fact]
    public async Task AnswerAsync_Should_Return_Current_Pilots_Latest_NonCancelled_Flight()
    {
        await using var context = CreateContext();
        var pilot = NewPilot();
        var olderFlight = NewFlight(new DateOnly(2026, 8, 10), TimeSpan.FromHours(2));
        var latestFlight = NewFlight(new DateOnly(2026, 9, 12), TimeSpan.FromHours(3));
        latestFlight.OriginICAO = "LTAC";
        latestFlight.DestinationICAO = "LTFM";
        var cancelledFlight = NewFlight(new DateOnly(2026, 9, 20), TimeSpan.FromHours(4), isCancelled: true);
        context.Pilots.Add(pilot);
        context.Flights.AddRange(olderFlight, latestFlight, cancelledFlight);
        context.Crew.AddRange(
            Assignment(pilot, olderFlight),
            Assignment(pilot, latestFlight),
            Assignment(pilot, cancelledFlight));
        await context.SaveChangesAsync();

        var service = CreateService(context, pilot.Id);

        var result = await service.TryAnswerAsync(
            new ChatRequest("Son uçuşumu göster", "tr", []),
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.Answer.Should().Contain("LTAC–LTFM").And.Contain("12.09.2026");
        result.Sources.Should().ContainSingle(source => source.Url == $"/flights/{latestFlight.Id}");
    }

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

    private static Flight NewFlight(DateOnly date, TimeSpan flightTime, bool isCancelled = false) => new()
    {
        Id = Guid.NewGuid(),
        OriginICAO = "LTFM",
        DestinationICAO = "LTAC",
        FlightTime = flightTime,
        AircraftType = "A320",
        Date = date,
        IsCancelled = isCancelled
    };

    private static CrewEntity Assignment(Pilot pilot, Flight flight) => new()
    {
        Id = Guid.NewGuid(),
        PilotId = pilot.Id,
        FlightId = flight.Id,
        DutyRole = DutyRole.PIC
    };

    private static PersonalChatService CreateService(TestApplicationDbContext context, Guid pilotId)
    {
        var currentUser = Substitute.For<ICurrentUserService>();
        currentUser.PilotId.Returns(pilotId);
        return new PersonalChatService(context, currentUser);
    }
}
