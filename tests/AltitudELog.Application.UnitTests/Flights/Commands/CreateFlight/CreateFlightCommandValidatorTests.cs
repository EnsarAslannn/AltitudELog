using AltitudELog.Application.Flights.Commands.CreateFlight;
using FluentValidation.TestHelper;

namespace AltitudELog.Application.UnitTests.Flights.Commands.CreateFlight;

public class CreateFlightCommandValidatorTests
{
    private readonly CreateFlightCommandValidator _validator = new();

    private static CreateFlightCommand ValidCommand() => new(
        OriginICAO: "LTFM",
        DestinationICAO: "EGLL",
        FlightTime: TimeSpan.FromHours(4),
        AircraftType: "A350",
        Date: DateOnly.FromDateTime(DateTime.UtcNow),
        METARInfo: null);

    [Fact]
    public void Should_Pass_For_Valid_Command()
    {
        var result = _validator.TestValidate(ValidCommand());

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData("LTF")]
    [InlineData("LTFMM")]
    public void Should_HaveError_When_OriginICAO_Is_Invalid(string originIcao)
    {
        var command = ValidCommand() with { OriginICAO = originIcao };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.OriginICAO);
    }

    [Theory]
    [InlineData("")]
    [InlineData("EGL")]
    [InlineData("EGLLL")]
    public void Should_HaveError_When_DestinationICAO_Is_Invalid(string destinationIcao)
    {
        var command = ValidCommand() with { DestinationICAO = destinationIcao };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.DestinationICAO);
    }

    [Fact]
    public void Should_HaveError_When_AircraftType_Is_Empty()
    {
        var command = ValidCommand() with { AircraftType = "" };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.AircraftType);
    }

    [Fact]
    public void Should_HaveError_When_AircraftType_Exceeds_MaxLength()
    {
        var command = ValidCommand() with { AircraftType = new string('A', 101) };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.AircraftType);
    }

    [Fact]
    public void Should_Pass_When_AircraftType_Is_At_MaxLength()
    {
        var command = ValidCommand() with { AircraftType = new string('A', 100) };

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveValidationErrorFor(c => c.AircraftType);
    }

    [Fact]
    public void Should_HaveError_When_METARInfo_Exceeds_MaxLength()
    {
        var command = ValidCommand() with { METARInfo = new string('M', 2001) };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.METARInfo);
    }

    [Fact]
    public void Should_Pass_When_METARInfo_Is_At_MaxLength()
    {
        var command = ValidCommand() with { METARInfo = new string('M', 2000) };

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveValidationErrorFor(c => c.METARInfo);
    }

    [Fact]
    public void Should_HaveError_When_FlightTime_Is_Zero()
    {
        var command = ValidCommand() with { FlightTime = TimeSpan.Zero };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.FlightTime);
    }

    [Fact]
    public void Should_HaveError_When_FlightTime_Is_Negative()
    {
        var command = ValidCommand() with { FlightTime = TimeSpan.FromHours(-1) };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.FlightTime);
    }

    [Fact]
    public void Should_HaveError_When_Date_Is_In_The_Future()
    {
        var command = ValidCommand() with { Date = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1) };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.Date);
    }

    [Fact]
    public void Should_Pass_When_Date_Is_Today_Or_Past()
    {
        var command = ValidCommand() with { Date = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-30) };

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveValidationErrorFor(c => c.Date);
    }
}
