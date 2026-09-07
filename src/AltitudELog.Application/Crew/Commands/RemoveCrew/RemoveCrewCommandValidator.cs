using FluentValidation;

namespace AltitudELog.Application.Crew.Commands.RemoveCrew;

public class RemoveCrewCommandValidator : AbstractValidator<RemoveCrewCommand>
{
    public RemoveCrewCommandValidator()
    {
        RuleFor(c => c.Id).NotEmpty();
    }
}
