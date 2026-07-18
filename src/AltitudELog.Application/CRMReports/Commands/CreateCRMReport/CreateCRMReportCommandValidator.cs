using AltitudELog.Application.Common.Interfaces;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.CRMReports.Commands.CreateCRMReport;

public class CreateCRMReportCommandValidator : AbstractValidator<CreateCRMReportCommand>
{
    public CreateCRMReportCommandValidator(IApplicationDbContext context)
    {
        RuleFor(r => r.FlightId)
            .NotEmpty()
            .MustAsync((flightId, cancellationToken) =>
                context.Flights.AnyAsync(f => f.Id == flightId, cancellationToken))
            .WithMessage("Flight '{PropertyValue}' does not exist.");

        RuleFor(r => r.Title).NotEmpty().MaximumLength(200);
        RuleFor(r => r.Description).NotEmpty().MaximumLength(4000);
        RuleFor(r => r.SeverityLevel).IsInEnum();
    }
}
