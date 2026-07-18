using FluentValidation;

namespace AltitudELog.Application.Flights.Commands.CreateFlight;

public class CreateFlightCommandValidator : AbstractValidator<CreateFlightCommand>
{
    public CreateFlightCommandValidator()
    {
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
