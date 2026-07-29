using FluentValidation;

namespace AltitudELog.Application.CRMReports.Commands.CreateCRMReport;

public class CreateCRMReportCommandValidator : AbstractValidator<CreateCRMReportCommand>
{
    public CreateCRMReportCommandValidator()
    {
        // FK existence is checked in the handler, which throws NotFoundException (404) — a
        // validation failure here would report a nonexistent flight as a 400 instead.
        RuleFor(r => r.FlightId).NotEmpty();
        RuleFor(r => r.Title).NotEmpty().MaximumLength(200);
        RuleFor(r => r.Description).NotEmpty().MaximumLength(4000);
        RuleFor(r => r.SeverityLevel).IsInEnum();
    }
}
