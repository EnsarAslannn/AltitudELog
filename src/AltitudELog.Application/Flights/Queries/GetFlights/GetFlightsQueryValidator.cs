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

        // Bounded because the term goes into a leading-wildcard LIKE, which no index can serve —
        // an unbounded string is a cheap way to make the database do a lot of work per request.
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

        // Without IsInEnum an out-of-range value would fall through the handler's sort switch to
        // its default arm and be served as a Date sort, quietly ignoring what was asked for.
        RuleFor(q => q.SortBy)
            .IsInEnum();
    }
}
