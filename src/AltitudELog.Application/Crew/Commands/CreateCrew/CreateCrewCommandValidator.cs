using FluentValidation;

namespace AltitudELog.Application.Crew.Commands.CreateCrew;

public class CreateCrewCommandValidator : AbstractValidator<CreateCrewCommand>
{
    public CreateCrewCommandValidator()
    {
        // FK existence is checked in the handler, which throws NotFoundException (404) — a
        // validation failure here would report a nonexistent flight/pilot as a 400 instead.
        RuleFor(c => c.FlightId).NotEmpty();
        RuleFor(c => c.PilotId).NotEmpty();
        RuleFor(c => c.DutyRole).IsInEnum();
    }
}
