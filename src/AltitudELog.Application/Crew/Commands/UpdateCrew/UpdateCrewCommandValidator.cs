using FluentValidation;

namespace AltitudELog.Application.Crew.Commands.UpdateCrew;

public class UpdateCrewCommandValidator : AbstractValidator<UpdateCrewCommand>
{
    public UpdateCrewCommandValidator()
    {
        RuleFor(c => c.Id).NotEmpty();
        RuleFor(c => c.DutyRole).IsInEnum();
    }
}
