using AltitudELog.Application.CRMReports.Commands.CreateCRMReport;
using AltitudELog.Domain.Enums;
using FluentValidation.TestHelper;

namespace AltitudELog.Application.UnitTests.CRMReports.Commands.CreateCRMReport;

public class CreateCRMReportCommandValidatorTests
{
    private static readonly CreateCRMReportCommandValidator Validator = new();

    private static CreateCRMReportCommand ValidCommand() => new(
        Guid.NewGuid(), "Unstable approach", "Description of the event.", false, SeverityLevel.Medium);

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
        var result = await Validator.TestValidateAsync(ValidCommand() with { FlightId = Guid.NewGuid() });

        result.ShouldNotHaveValidationErrorFor(c => c.FlightId);
    }

    [Fact]
    public async Task Should_HaveError_When_Title_Is_Empty()
    {
        var result = await Validator.TestValidateAsync(ValidCommand() with { Title = "" });

        result.ShouldHaveValidationErrorFor(c => c.Title);
    }

    [Fact]
    public async Task Should_HaveError_When_Title_Exceeds_MaxLength()
    {
        var result = await Validator.TestValidateAsync(ValidCommand() with { Title = new string('T', 201) });

        result.ShouldHaveValidationErrorFor(c => c.Title);
    }

    [Fact]
    public async Task Should_HaveError_When_Description_Exceeds_MaxLength()
    {
        var command = ValidCommand() with { Description = new string('D', 4001) };

        var result = await Validator.TestValidateAsync(command);

        result.ShouldHaveValidationErrorFor(c => c.Description);
    }

    [Fact]
    public async Task Should_HaveError_When_SeverityLevel_Is_Out_Of_Range()
    {
        var command = ValidCommand() with { SeverityLevel = (SeverityLevel)999 };

        var result = await Validator.TestValidateAsync(command);

        result.ShouldHaveValidationErrorFor(c => c.SeverityLevel);
    }
}
