using AltitudELog.Application.Crew.Commands.CreateCrew;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using FluentValidation.TestHelper;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.UnitTests.Crew.Commands.CreateCrew;

public class CreateCrewCommandValidatorTests
{
    private static TestApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestApplicationDbContext(options);
    }

    private static Flight NewFlight() => new()
    {
        Id = Guid.NewGuid(),
        OriginICAO = "LTFM",
        DestinationICAO = "EGLL",
        FlightTime = TimeSpan.FromHours(4),
        AircraftType = "A350",
        Date = DateOnly.FromDateTime(DateTime.UtcNow)
    };

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
    public async Task Should_Pass_When_Flight_And_Pilot_Exist()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        var pilot = NewPilot();
        context.Flights.Add(flight);
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var validator = new CreateCrewCommandValidator(context);
        var command = new CreateCrewCommand(flight.Id, pilot.Id, DutyRole.PIC);

        var result = await validator.TestValidateAsync(command);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public async Task Should_HaveError_When_Flight_Does_Not_Exist()
    {
        await using var context = CreateContext();
        var pilot = NewPilot();
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        var validator = new CreateCrewCommandValidator(context);
        var command = new CreateCrewCommand(Guid.NewGuid(), pilot.Id, DutyRole.PIC);

        var result = await validator.TestValidateAsync(command);

        result.ShouldHaveValidationErrorFor(c => c.FlightId);
    }

    [Fact]
    public async Task Should_HaveError_When_Pilot_Does_Not_Exist()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        var validator = new CreateCrewCommandValidator(context);
        var command = new CreateCrewCommand(flight.Id, Guid.NewGuid(), DutyRole.PIC);

        var result = await validator.TestValidateAsync(command);

        result.ShouldHaveValidationErrorFor(c => c.PilotId);
    }
}
