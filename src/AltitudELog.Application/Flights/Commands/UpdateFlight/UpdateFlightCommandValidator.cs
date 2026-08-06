using FluentValidation;

namespace AltitudELog.Application.Flights.Commands.UpdateFlight;

public class UpdateFlightCommandValidator : AbstractValidator<UpdateFlightCommand>
{
    public UpdateFlightCommandValidator()
    {
        RuleFor(f => f.FlightId).NotEmpty();

        RuleFor(f => f.OriginICAO)
            .NotEmpty()
            .Length(4);

        RuleFor(f => f.DestinationICAO)
            .NotEmpty()
            .Length(4);

        RuleFor(f => f.AircraftType)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(f => f.FlightTime)
            .Must(t => t > TimeSpan.Zero)
            .WithMessage("FlightTime must be greater than zero.");

        RuleFor(f => f.Date)
            .LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Date cannot be in the future.");
    }
}
