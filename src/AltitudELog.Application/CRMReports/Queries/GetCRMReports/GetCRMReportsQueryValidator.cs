using FluentValidation;

namespace AltitudELog.Application.CRMReports.Queries.GetCRMReports;

public class GetCRMReportsQueryValidator : AbstractValidator<GetCRMReportsQuery>
{
    public GetCRMReportsQueryValidator()
    {
        RuleFor(q => q.PageNumber)
            .GreaterThanOrEqualTo(1);

        RuleFor(q => q.PageSize)
            .InclusiveBetween(1, 100);

        RuleFor(q => q.Search)
            .MaximumLength(200);

        RuleFor(q => q.Status)
            .IsInEnum()
            .When(q => q.Status.HasValue);

        RuleFor(q => q.SeverityLevel)
            .IsInEnum()
            .When(q => q.SeverityLevel.HasValue);

        RuleFor(q => q.DateTo)
            .GreaterThanOrEqualTo(q => q.DateFrom!.Value)
            .When(q => q.DateFrom.HasValue && q.DateTo.HasValue)
            .WithMessage("DateTo must be on or after DateFrom.");

        RuleFor(q => q.SortBy)
            .IsInEnum();
    }
}
