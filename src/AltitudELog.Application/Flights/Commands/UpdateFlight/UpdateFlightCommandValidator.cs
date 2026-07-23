using AltitudELog.Application.Common.Interfaces;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.Flights.Commands.UpdateFlight;

public class UpdateFlightCommandValidator : AbstractValidator<UpdateFlightCommand>
{
    public UpdateFlightCommandValidator(IApplicationDbContext context)
    {
        RuleFor(f => f.FlightId)
            .NotEmpty()
            .MustAsync((flightId, cancellationToken) =>
                context.Flights.AnyAsync(f => f.Id == flightId, cancellationToken))
            .WithMessage("Flight '{PropertyValue}' does not exist.");

        RuleFor(f => f.OriginICAO)
            .NotEmpty()
            .Length(4);

        RuleFor(f => f.DestinationICAO)
            .NotEmpty()
            .Length(4);

        RuleFor(f => f.AircraftType)
            .NotEmpty();

        RuleFor(f => f.FlightTime)
            .Must(t => t > TimeSpan.Zero)
            .WithMessage("FlightTime must be greater than zero.");

        RuleFor(f => f.Date)
            .LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Date cannot be in the future.");
    }
}
