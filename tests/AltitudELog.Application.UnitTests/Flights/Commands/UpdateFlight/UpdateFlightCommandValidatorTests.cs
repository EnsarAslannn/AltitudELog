using AltitudELog.Application.Flights.Commands.UpdateFlight;
using FluentValidation.TestHelper;

namespace AltitudELog.Application.UnitTests.Flights.Commands.UpdateFlight;

public class UpdateFlightCommandValidatorTests
{
    private static readonly UpdateFlightCommandValidator Validator = new();

    private static UpdateFlightCommand ValidCommand() => new(
        FlightId: Guid.NewGuid(),
        OriginICAO: "LTFM",
        DestinationICAO: "EGLL",
        FlightTime: TimeSpan.FromHours(4),
        AircraftType: "A350",
        Date: DateOnly.FromDateTime(DateTime.UtcNow));

    [Fact]
    public async Task Should_Pass_For_Valid_Command()
    {
        var result = await Validator.TestValidateAsync(ValidCommand());

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public async Task Should_HaveError_When_FlightId_Is_Empty()
    {
        var result = await Validator.TestValidateAsync(ValidCommand() with { FlightId = Guid.Empty });

        result.ShouldHaveValidationErrorFor(c => c.FlightId);
    }

    [Fact]
    public async Task Should_Not_Reject_An_Unknown_FlightId()
    {
        // An unknown-but-well-formed id must reach the handler, which answers 404. Reinstating an
        // existence rule here would turn that into a 400 and break FlightNotFoundTests.
        var result = await Validator.TestValidateAsync(ValidCommand() with { FlightId = Guid.NewGuid() });

        result.ShouldNotHaveValidationErrorFor(c => c.FlightId);
    }

    [Fact]
    public async Task Should_HaveError_When_AircraftType_Is_Empty()
    {
        var result = await Validator.TestValidateAsync(ValidCommand() with { AircraftType = "" });

        result.ShouldHaveValidationErrorFor(c => c.AircraftType);
    }

    [Fact]
    public async Task Should_HaveError_When_AircraftType_Exceeds_MaxLength()
    {
        var command = ValidCommand() with { AircraftType = new string('A', 101) };

        var result = await Validator.TestValidateAsync(command);

        result.ShouldHaveValidationErrorFor(c => c.AircraftType);
    }

    [Fact]
    public async Task Should_Pass_When_AircraftType_Is_At_MaxLength()
    {
        var command = ValidCommand() with { AircraftType = new string('A', 100) };

        var result = await Validator.TestValidateAsync(command);

        result.ShouldNotHaveValidationErrorFor(c => c.AircraftType);
    }

    [Fact]
    public async Task Should_HaveError_When_Date_Is_In_The_Future()
    {
        var command = ValidCommand() with { Date = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1) };

        var result = await Validator.TestValidateAsync(command);

        result.ShouldHaveValidationErrorFor(c => c.Date);
    }

    [Theory]
    [InlineData("")]
    [InlineData("LTF")]
    [InlineData("LTFMM")]
    public async Task Should_HaveError_When_OriginICAO_Is_Invalid(string originIcao)
    {
        var result = await Validator.TestValidateAsync(ValidCommand() with { OriginICAO = originIcao });

        result.ShouldHaveValidationErrorFor(c => c.OriginICAO);
    }

    [Theory]
    [InlineData("")]
    [InlineData("EGL")]
    [InlineData("EGLLL")]
    public async Task Should_HaveError_When_DestinationICAO_Is_Invalid(string destinationIcao)
    {
        var command = ValidCommand() with { DestinationICAO = destinationIcao };

        var result = await Validator.TestValidateAsync(command);

        result.ShouldHaveValidationErrorFor(c => c.DestinationICAO);
    }

    [Fact]
    public async Task Should_HaveError_When_FlightTime_Is_Zero()
    {
        var result = await Validator.TestValidateAsync(ValidCommand() with { FlightTime = TimeSpan.Zero });

        result.ShouldHaveValidationErrorFor(c => c.FlightTime);
    }
}
