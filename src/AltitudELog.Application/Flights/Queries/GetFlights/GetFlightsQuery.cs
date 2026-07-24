using MediatR;

namespace AltitudELog.Application.Flights.Queries.GetFlights;

public record GetFlightsQuery : IRequest<FlightsPageResult>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}
