using FluentValidation;

namespace AltitudELog.Application.Crew.Commands.CreateCrew;

public class CreateCrewCommandValidator : AbstractValidator<CreateCrewCommand>
{
    public CreateCrewCommandValidator()
    {
        RuleFor(c => c.FlightId).NotEmpty();
        RuleFor(c => c.PilotId).NotEmpty();
        RuleFor(c => c.DutyRole).IsInEnum();
    }
}
