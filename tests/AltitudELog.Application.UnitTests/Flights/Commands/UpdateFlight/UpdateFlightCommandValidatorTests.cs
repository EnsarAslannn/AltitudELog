using AltitudELog.Application.Flights.Commands.UpdateFlight;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using FluentValidation.TestHelper;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.UnitTests.Flights.Commands.UpdateFlight;

public class UpdateFlightCommandValidatorTests
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

    private static UpdateFlightCommand ValidCommand(Guid flightId) => new(
        FlightId: flightId,
        OriginICAO: "LTFM",
        DestinationICAO: "EGLL",
        FlightTime: TimeSpan.FromHours(4),
        AircraftType: "A350",
        Date: DateOnly.FromDateTime(DateTime.UtcNow));

    [Fact]
    public async Task Should_Pass_For_Valid_Command()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        var validator = new UpdateFlightCommandValidator(context);
        var result = await validator.TestValidateAsync(ValidCommand(flight.Id));

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public async Task Should_HaveError_When_FlightId_Does_Not_Exist()
    {
        await using var context = CreateContext();

        var validator = new UpdateFlightCommandValidator(context);
        var result = await validator.TestValidateAsync(ValidCommand(Guid.NewGuid()));

        result.ShouldHaveValidationErrorFor(c => c.FlightId);
    }

    [Fact]
    public async Task Should_HaveError_When_AircraftType_Is_Empty()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        var validator = new UpdateFlightCommandValidator(context);
        var command = ValidCommand(flight.Id) with { AircraftType = "" };

        var result = await validator.TestValidateAsync(command);

        result.ShouldHaveValidationErrorFor(c => c.AircraftType);
    }

    [Fact]
    public async Task Should_HaveError_When_AircraftType_Exceeds_MaxLength()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        var validator = new UpdateFlightCommandValidator(context);
        var command = ValidCommand(flight.Id) with { AircraftType = new string('A', 101) };

        var result = await validator.TestValidateAsync(command);

        result.ShouldHaveValidationErrorFor(c => c.AircraftType);
    }

    [Fact]
    public async Task Should_Pass_When_AircraftType_Is_At_MaxLength()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        var validator = new UpdateFlightCommandValidator(context);
        var command = ValidCommand(flight.Id) with { AircraftType = new string('A', 100) };

        var result = await validator.TestValidateAsync(command);

        result.ShouldNotHaveValidationErrorFor(c => c.AircraftType);
    }

    [Fact]
    public async Task Should_HaveError_When_Date_Is_In_The_Future()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        var validator = new UpdateFlightCommandValidator(context);
        var command = ValidCommand(flight.Id) with { Date = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1) };

        var result = await validator.TestValidateAsync(command);

        result.ShouldHaveValidationErrorFor(c => c.Date);
    }

    [Theory]
    [InlineData("")]
    [InlineData("LTF")]
    [InlineData("LTFMM")]
    public async Task Should_HaveError_When_OriginICAO_Is_Invalid(string originIcao)
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        var validator = new UpdateFlightCommandValidator(context);
        var command = ValidCommand(flight.Id) with { OriginICAO = originIcao };

        var result = await validator.TestValidateAsync(command);

        result.ShouldHaveValidationErrorFor(c => c.OriginICAO);
    }

    [Fact]
    public async Task Should_HaveError_When_FlightTime_Is_Zero()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        var validator = new UpdateFlightCommandValidator(context);
        var command = ValidCommand(flight.Id) with { FlightTime = TimeSpan.Zero };

        var result = await validator.TestValidateAsync(command);

        result.ShouldHaveValidationErrorFor(c => c.FlightTime);
    }
}
