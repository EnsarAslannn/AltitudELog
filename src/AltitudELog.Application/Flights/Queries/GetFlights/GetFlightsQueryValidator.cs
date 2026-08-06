using FluentValidation;

namespace AltitudELog.Application.Flights.Queries.GetFlights;

public class GetFlightsQueryValidator : AbstractValidator<GetFlightsQuery>
{
    public GetFlightsQueryValidator()
    {
        RuleFor(q => q.PageNumber)
            .GreaterThanOrEqualTo(1);

        RuleFor(q => q.PageSize)
            .InclusiveBetween(1, 100);

        RuleFor(q => q.Search)
            .MaximumLength(100);

        RuleFor(q => q.OriginICAO)
            .Length(4)
            .When(q => !string.IsNullOrWhiteSpace(q.OriginICAO));

        RuleFor(q => q.DestinationICAO)
            .Length(4)
            .When(q => !string.IsNullOrWhiteSpace(q.DestinationICAO));

        RuleFor(q => q.AircraftType)
            .MaximumLength(100);

        RuleFor(q => q.DateTo)
            .GreaterThanOrEqualTo(q => q.DateFrom!.Value)
            .When(q => q.DateFrom.HasValue && q.DateTo.HasValue)
            .WithMessage("DateTo must be on or after DateFrom.");

        RuleFor(q => q.SortBy)
            .IsInEnum();
    }
}
