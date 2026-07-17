using FluentValidation;

namespace AltitudELog.Application.CRMReports.Commands.CreateCRMReport;

public class CreateCRMReportCommandValidator : AbstractValidator<CreateCRMReportCommand>
{
    public CreateCRMReportCommandValidator()
    {
        RuleFor(r => r.FlightId).NotEmpty();
        RuleFor(r => r.Title).NotEmpty().MaximumLength(200);
        RuleFor(r => r.Description).NotEmpty().MaximumLength(4000);
        RuleFor(r => r.SeverityLevel).IsInEnum();
    }
}
