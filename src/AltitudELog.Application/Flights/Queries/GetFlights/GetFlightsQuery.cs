using MediatR;

namespace AltitudELog.Application.Flights.Queries.GetFlights;

public record GetFlightsQuery : IRequest<List<FlightDto>>;
