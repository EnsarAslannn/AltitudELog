using AltitudELog.Application.Crew.Commands.CreateCrew;
using AltitudELog.Domain.Enums;
using FluentValidation.TestHelper;

namespace AltitudELog.Application.UnitTests.Crew.Commands.CreateCrew;

public class CreateCrewCommandValidatorTests
{
    private static readonly CreateCrewCommandValidator Validator = new();

    [Fact]
    public async Task Should_Pass_For_Valid_Command()
    {
        var command = new CreateCrewCommand(Guid.NewGuid(), Guid.NewGuid(), DutyRole.PIC);

        var result = await Validator.TestValidateAsync(command);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public async Task Should_HaveError_When_FlightId_Is_Empty()
    {
        var command = new CreateCrewCommand(Guid.Empty, Guid.NewGuid(), DutyRole.PIC);

        var result = await Validator.TestValidateAsync(command);

        result.ShouldHaveValidationErrorFor(c => c.FlightId);
    }

    [Fact]
    public async Task Should_HaveError_When_PilotId_Is_Empty()
    {
        var command = new CreateCrewCommand(Guid.NewGuid(), Guid.Empty, DutyRole.PIC);

        var result = await Validator.TestValidateAsync(command);

        result.ShouldHaveValidationErrorFor(c => c.PilotId);
    }

    [Fact]
    public async Task Should_HaveError_When_DutyRole_Is_Out_Of_Range()
    {
        var command = new CreateCrewCommand(Guid.NewGuid(), Guid.NewGuid(), (DutyRole)999);

        var result = await Validator.TestValidateAsync(command);

        result.ShouldHaveValidationErrorFor(c => c.DutyRole);
    }

    [Fact]
    public async Task Should_Not_Reject_Unknown_Foreign_Keys()
    {
        var command = new CreateCrewCommand(Guid.NewGuid(), Guid.NewGuid(), DutyRole.SIC);

        var result = await Validator.TestValidateAsync(command);

        result.ShouldNotHaveValidationErrorFor(c => c.FlightId);
        result.ShouldNotHaveValidationErrorFor(c => c.PilotId);
    }
}
