using AltitudELog.Application.Common.Interfaces;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.Crew.Commands.CreateCrew;

public class CreateCrewCommandValidator : AbstractValidator<CreateCrewCommand>
{
    public CreateCrewCommandValidator(IApplicationDbContext context)
    {
        RuleFor(c => c.FlightId)
            .NotEmpty()
            .MustAsync((flightId, cancellationToken) =>
                context.Flights.AnyAsync(f => f.Id == flightId, cancellationToken))
            .WithMessage("Flight '{PropertyValue}' does not exist.");

        RuleFor(c => c.PilotId)
            .NotEmpty()
            .MustAsync((pilotId, cancellationToken) =>
                context.Pilots.AnyAsync(p => p.Id == pilotId, cancellationToken))
            .WithMessage("Pilot '{PropertyValue}' does not exist.");

        RuleFor(c => c.DutyRole).IsInEnum();
    }
}
