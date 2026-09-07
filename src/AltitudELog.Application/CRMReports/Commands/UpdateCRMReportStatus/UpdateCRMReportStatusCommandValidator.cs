using FluentValidation;

namespace AltitudELog.Application.CRMReports.Commands.UpdateCRMReportStatus;

public class UpdateCRMReportStatusCommandValidator : AbstractValidator<UpdateCRMReportStatusCommand>
{
    public UpdateCRMReportStatusCommandValidator()
    {
        RuleFor(c => c.Id).NotEmpty();
        RuleFor(c => c.Status).IsInEnum();
    }
}
